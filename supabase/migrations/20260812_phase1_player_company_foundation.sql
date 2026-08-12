-- Phase 1: persistent player identity, role-first onboarding, and company context.

alter table public.profiles
  add column if not exists onboarding_path text not null default 'founder';
alter table public.profiles
  add column if not exists preferred_role text;
alter table public.profiles
  add column if not exists current_business_id uuid references public.businesses(id) on delete set null;
alter table public.profiles
  add column if not exists current_role text;
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table public.profiles drop constraint if exists profiles_onboarding_path_check;
alter table public.profiles add constraint profiles_onboarding_path_check
  check (onboarding_path in ('founder','executive','explore'));

alter table public.profiles drop constraint if exists profiles_preferred_role_check;
alter table public.profiles add constraint profiles_preferred_role_check
  check (preferred_role is null or preferred_role in ('ceo','cfo','cmo','coo','cto','chro'));

alter table public.profiles drop constraint if exists profiles_current_role_check;
alter table public.profiles add constraint profiles_current_role_check
  check (current_role is null or current_role in ('ceo','cfo','cmo','coo','cto','chro'));

alter table public.business_members drop constraint if exists business_members_role_check;
alter table public.business_members add constraint business_members_role_check
  check (role in ('owner','ceo','cfo','cmo','coo','cto','chro','founder','member'));

alter table public.business_invitations
  add column if not exists requested_role text not null default 'founder';
alter table public.business_invitations drop constraint if exists business_invitations_requested_role_check;
alter table public.business_invitations add constraint business_invitations_requested_role_check
  check (requested_role in ('ceo','cfo','cmo','coo','cto','chro','founder'));

create index if not exists profiles_current_business_idx on public.profiles(current_business_id);
create index if not exists business_members_business_role_idx on public.business_members(business_id, role, joined_at desc);
create index if not exists business_invitations_invitee_role_idx on public.business_invitations(invitee_id, requested_role, status, created_at desc);

create or replace function public.set_player_onboarding(p_path text, p_role text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare actor uuid := (select auth.uid());
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_path not in ('founder','executive','explore') then raise exception 'Invalid onboarding path'; end if;
  if p_role is not null and p_role not in ('ceo','cfo','cmo','coo','cto','chro') then raise exception 'Invalid role'; end if;

  insert into public.profiles(user_id, display_name, onboarding_path, preferred_role)
  values (actor, 'Founder', p_path, p_role)
  on conflict (user_id) do update set
    onboarding_path = excluded.onboarding_path,
    preferred_role = excluded.preferred_role,
    updated_at = now();

  return true;
end;
$$;
revoke all on function public.set_player_onboarding(text,text) from public, anon;
grant execute on function public.set_player_onboarding(text,text) to authenticated;

create or replace function public.get_player_bootstrap()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'profile', to_jsonb(p),
    'current_business', case when b.id is null then null else to_jsonb(b) end,
    'current_membership', case when bm.business_id is null then null else to_jsonb(bm) end
  )
  from public.profiles p
  left join public.businesses b on b.id = p.current_business_id
  left join public.business_members bm on bm.business_id = p.current_business_id and bm.user_id = p.user_id
  where p.user_id = (select auth.uid());
$$;
revoke all on function public.get_player_bootstrap() from public, anon;
grant execute on function public.get_player_bootstrap() to authenticated;

create or replace function public.create_enterprise(
  p_name text,
  p_industry text,
  p_team_size text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  business_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_team_size not in ('solo','pair','trio','company') then raise exception 'Invalid enterprise size'; end if;
  if length(trim(p_name)) < 1 or length(trim(p_name)) > 120 then raise exception 'Invalid enterprise name'; end if;

  insert into public.businesses(user_id,name,industry,team_size,metadata)
  values(actor,trim(p_name),nullif(trim(p_industry),''),p_team_size,coalesce(p_metadata,'{}'::jsonb))
  returning id into business_id;

  insert into public.business_members(business_id,user_id,role)
  values(business_id,actor,'ceo');

  insert into public.profiles(user_id, display_name, onboarding_path, preferred_role, current_business_id, current_role, onboarding_completed)
  values(actor, 'Founder', 'founder', 'ceo', business_id, 'ceo', true)
  on conflict (user_id) do update set
    onboarding_path = 'founder',
    preferred_role = 'ceo',
    current_business_id = business_id,
    current_role = 'ceo',
    onboarding_completed = true,
    updated_at = now();

  return business_id;
end;
$$;
revoke all on function public.create_enterprise(text,text,text,jsonb) from public, anon;
grant execute on function public.create_enterprise(text,text,text,jsonb) to authenticated;

create or replace function public.send_business_invitation(
  p_business_id uuid,
  p_invitee_id uuid,
  p_requested_role text default 'founder'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  business_row public.businesses%rowtype;
  limit_count integer;
  participant_count integer;
  invitation_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_business_id is null or p_invitee_id is null then raise exception 'Business and invitee are required'; end if;
  if actor = p_invitee_id then raise exception 'You cannot invite yourself'; end if;
  if p_requested_role not in ('cfo','cmo','coo','cto','chro','founder') then raise exception 'Invalid requested role'; end if;

  select * into business_row from public.businesses where id = p_business_id and user_id = actor for update;
  if not found then raise exception 'You do not own this enterprise'; end if;

  limit_count := public.business_participant_limit(business_row.team_size);
  select count(*) into participant_count from public.business_members where business_id = p_business_id;
  if limit_count is not null and participant_count >= limit_count then raise exception 'This enterprise has reached its participant limit'; end if;
  if exists (select 1 from public.business_members where business_id = p_business_id and user_id = p_invitee_id) then raise exception 'That user is already a participant'; end if;
  if exists (select 1 from public.business_invitations where business_id = p_business_id and invitee_id = p_invitee_id and status = 'pending') then raise exception 'An invitation is already pending for that user'; end if;

  insert into public.business_invitations(business_id, inviter_id, invitee_id, requested_role)
  values (p_business_id, actor, p_invitee_id, p_requested_role)
  returning id into invitation_id;

  return invitation_id;
end;
$$;
revoke all on function public.send_business_invitation(uuid,uuid,text) from public, anon;
grant execute on function public.send_business_invitation(uuid,uuid,text) to authenticated;

create or replace function public.accept_business_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  invite public.business_invitations%rowtype;
  business_row public.businesses%rowtype;
  limit_count integer;
  participant_count integer;
  assigned_role text;
begin
  if actor is null then raise exception 'Authentication required'; end if;

  select * into invite from public.business_invitations
  where id = p_invitation_id and invitee_id = actor and status = 'pending'
  for update;
  if not found then raise exception 'Invitation not found or no longer pending'; end if;

  select * into business_row from public.businesses where id = invite.business_id for update;
  if not found then raise exception 'Enterprise no longer exists'; end if;

  limit_count := public.business_participant_limit(business_row.team_size);
  select count(*) into participant_count from public.business_members where business_id = invite.business_id;
  if limit_count is not null and participant_count >= limit_count then
    update public.business_invitations set status='expired', responded_at=now() where id=invite.id;
    raise exception 'This enterprise has reached its participant limit';
  end if;

  assigned_role := case when invite.requested_role = 'founder' then 'founder' else invite.requested_role end;
  insert into public.business_members(business_id,user_id,role)
  values(invite.business_id,actor,assigned_role)
  on conflict(business_id,user_id) do update set role = excluded.role;

  update public.business_invitations set status='accepted', responded_at=now() where id=invite.id;

  insert into public.profiles(user_id, onboarding_path, preferred_role, current_business_id, current_role, onboarding_completed)
  values(actor, 'executive', nullif(invite.requested_role,'founder'), invite.business_id,
    case when invite.requested_role = 'founder' then null else invite.requested_role end, true)
  on conflict (user_id) do update set
    onboarding_path = 'executive',
    preferred_role = nullif(invite.requested_role,'founder'),
    current_business_id = invite.business_id,
    current_role = case when invite.requested_role = 'founder' then null else invite.requested_role end,
    onboarding_completed = true,
    updated_at = now();

  return invite.business_id;
end;
$$;
revoke all on function public.accept_business_invitation(uuid) from public, anon;
grant execute on function public.accept_business_invitation(uuid) to authenticated;
