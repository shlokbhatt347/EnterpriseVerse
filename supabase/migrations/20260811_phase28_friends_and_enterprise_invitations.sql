-- Phase 28: production-safe friend search and enterprise collaboration.
create index if not exists profiles_display_name_lower_idx on public.profiles (lower(display_name));

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'founder' check (role in ('owner','founder','member')),
  joined_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create table if not exists public.business_invitations (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade, invitee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','expired')),
  created_at timestamptz not null default now(), responded_at timestamptz, unique (business_id, invitee_id), check (inviter_id <> invitee_id)
);
alter table public.businesses add column if not exists team_size text not null default 'solo';
alter table public.businesses drop constraint if exists businesses_team_size_check;
alter table public.businesses add constraint businesses_team_size_check check (team_size in ('solo','pair','trio','company'));
create index if not exists business_members_user_idx on public.business_members(user_id, joined_at desc);
create index if not exists business_invitations_invitee_idx on public.business_invitations(invitee_id, status, created_at desc);
create index if not exists business_invitations_business_idx on public.business_invitations(business_id, status, created_at desc);
alter table public.business_members enable row level security;
alter table public.business_invitations enable row level security;

create or replace function public.is_business_member(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.business_members bm where bm.business_id = p_business_id and bm.user_id = (select auth.uid())); $$;
revoke all on function public.is_business_member(uuid) from public, anon;
grant execute on function public.is_business_member(uuid) to authenticated;

-- Business read access is owner-or-member; only the owner can mutate the business row.
drop policy if exists businesses_all_own on public.businesses;
drop policy if exists businesses_select_collaborator on public.businesses;
create policy businesses_select_collaborator on public.businesses for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_business_member(id)));
drop policy if exists businesses_insert_own on public.businesses;
create policy businesses_insert_own on public.businesses for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists businesses_update_own on public.businesses;
create policy businesses_update_own on public.businesses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists businesses_delete_own on public.businesses;
create policy businesses_delete_own on public.businesses for delete to authenticated using ((select auth.uid()) = user_id);

-- Membership visibility is implemented through a definer helper to avoid RLS recursion.
drop policy if exists business_members_select_member on public.business_members;
create policy business_members_select_member on public.business_members for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_business_member(business_id)));
drop policy if exists business_members_insert_owner on public.business_members;
create policy business_members_insert_owner on public.business_members for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.businesses b where b.id = business_members.business_id and b.user_id = (select auth.uid())));

-- Invitations are visible only to sender/recipient. Mutation is RPC-only.
drop policy if exists business_invitations_select_participant on public.business_invitations;
create policy business_invitations_select_participant on public.business_invitations for select to authenticated using ((select auth.uid()) = inviter_id or (select auth.uid()) = invitee_id);
drop policy if exists business_invitations_insert_inviter on public.business_invitations;
create policy business_invitations_insert_inviter on public.business_invitations for insert to authenticated with check ((select auth.uid()) = inviter_id);
drop policy if exists business_invitations_update_participant on public.business_invitations;
create policy business_invitations_update_participant on public.business_invitations for update to authenticated using ((select auth.uid()) = inviter_id or (select auth.uid()) = invitee_id) with check ((select auth.uid()) = inviter_id or (select auth.uid()) = invitee_id);
grant select on public.business_members, public.business_invitations to authenticated;
revoke all on public.business_members, public.business_invitations from anon;

create or replace function public.search_people(p_query text)
returns table(user_id uuid, display_name text, email text)
language sql stable security definer set search_path = public, auth
as $$
  with q as (select lower(trim(coalesce(p_query, ''))) as value)
  select p.user_id, p.display_name, case when lower(coalesce(u.email, '')) = q.value then u.email else null end
  from public.profiles p join auth.users u on u.id = p.user_id cross join q
  where (select auth.uid()) is not null and length(q.value) >= 2
    and (lower(p.display_name) like '%' || q.value || '%' or lower(coalesce(u.email, '')) = q.value)
    and p.user_id <> (select auth.uid())
  order by case when lower(coalesce(u.email, '')) = q.value then 0 else 1 end, lower(p.display_name)
  limit 20;
$$;
revoke all on function public.search_people(text) from public, anon;
grant execute on function public.search_people(text) to authenticated;

create or replace function public.business_participant_limit(p_team_size text)
returns integer language sql immutable as $$ select case p_team_size when 'solo' then 1 when 'pair' then 2 when 'trio' then 3 else null end; $$;
revoke all on function public.business_participant_limit(text) from public, anon;
grant execute on function public.business_participant_limit(text) to authenticated;

create or replace function public.send_business_invitation(p_business_id uuid, p_invitee_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare actor uuid := (select auth.uid()); business_row public.businesses%rowtype; limit_count integer; participant_count integer; invitation_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_business_id is null or p_invitee_id is null then raise exception 'Business and invitee are required'; end if;
  if actor = p_invitee_id then raise exception 'You cannot invite yourself'; end if;
  select * into business_row from public.businesses where id = p_business_id and user_id = actor for update;
  if not found then raise exception 'You do not own this enterprise'; end if;
  limit_count := public.business_participant_limit(business_row.team_size);
  select count(*) into participant_count from public.business_members where business_id = p_business_id;
  if limit_count is not null and participant_count >= limit_count then raise exception 'This enterprise has reached its participant limit'; end if;
  if exists (select 1 from public.business_members where business_id = p_business_id and user_id = p_invitee_id) then raise exception 'That user is already a participant'; end if;
  if exists (select 1 from public.business_invitations where business_id = p_business_id and invitee_id = p_invitee_id and status = 'pending') then raise exception 'An invitation is already pending for that user'; end if;
  insert into public.business_invitations(business_id, inviter_id, invitee_id) values (p_business_id, actor, p_invitee_id) returning id into invitation_id;
  return invitation_id;
end;
$$;
revoke all on function public.send_business_invitation(uuid,uuid) from public, anon;
grant execute on function public.send_business_invitation(uuid,uuid) to authenticated;

create or replace function public.accept_business_invitation(p_invitation_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare actor uuid := (select auth.uid()); invite public.business_invitations%rowtype; business_row public.businesses%rowtype; limit_count integer; participant_count integer;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into invite from public.business_invitations where id = p_invitation_id and invitee_id = actor and status = 'pending' for update;
  if not found then raise exception 'Invitation not found or no longer pending'; end if;
  select * into business_row from public.businesses where id = invite.business_id for update;
  if not found then raise exception 'Enterprise no longer exists'; end if;
  limit_count := public.business_participant_limit(business_row.team_size);
  select count(*) into participant_count from public.business_members where business_id = invite.business_id;
  if limit_count is not null and participant_count >= limit_count then update public.business_invitations set status='expired',responded_at=now() where id=invite.id; raise exception 'This enterprise has reached its participant limit'; end if;
  insert into public.business_members(business_id,user_id,role) values(invite.business_id,actor,'founder') on conflict(business_id,user_id) do nothing;
  update public.business_invitations set status='accepted',responded_at=now() where id=invite.id;
  return invite.business_id;
end;
$$;
revoke all on function public.accept_business_invitation(uuid) from public, anon;
grant execute on function public.accept_business_invitation(uuid) to authenticated;

create or replace function public.create_enterprise(p_name text,p_industry text,p_team_size text,p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public
as $$
declare actor uuid := (select auth.uid()); business_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_team_size not in ('solo','pair','trio','company') then raise exception 'Invalid enterprise size'; end if;
  if length(trim(p_name)) < 1 or length(trim(p_name)) > 120 then raise exception 'Invalid enterprise name'; end if;
  insert into public.businesses(user_id,name,industry,team_size,metadata) values(actor,trim(p_name),nullif(trim(p_industry),''),p_team_size,coalesce(p_metadata,'{}'::jsonb)) returning id into business_id;
  insert into public.business_members(business_id,user_id,role) values(business_id,actor,'owner');
  return business_id;
end;
$$;
revoke all on function public.create_enterprise(text,text,text,jsonb) from public, anon;
grant execute on function public.create_enterprise(text,text,text,jsonb) to authenticated;

revoke insert, update, delete on public.business_members from authenticated;
revoke insert, update, delete on public.business_invitations from authenticated;
