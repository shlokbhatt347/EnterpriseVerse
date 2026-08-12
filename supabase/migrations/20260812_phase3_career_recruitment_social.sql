-- Phase 3: career identity, recruitment marketplace, company mobility and unified notifications.

-- A player's membership can now become historical without retaining company access.
alter table public.business_members add column if not exists membership_status text not null default 'active';
alter table public.business_members add column if not exists left_at timestamptz;
alter table public.business_members drop constraint if exists business_members_status_check;
alter table public.business_members add constraint business_members_status_check
  check (membership_status in ('active','ended'));
create index if not exists business_members_active_idx on public.business_members(business_id, membership_status, role);
create index if not exists business_members_user_active_idx on public.business_members(user_id, membership_status, joined_at desc);

create or replace function public.is_business_member(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = (select auth.uid())
      and bm.membership_status = 'active'
  );
$$;
revoke all on function public.is_business_member(uuid) from public, anon;
grant execute on function public.is_business_member(uuid) to authenticated;

create table if not exists public.player_career_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  company_name text not null,
  role text not null check (role in ('ceo','cfo','cmo','coo','cto','chro','founder','member','owner')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  performance_score numeric(6,2) not null default 0 check (performance_score >= 0 and performance_score <= 100),
  summary text not null default '',
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index if not exists player_career_history_user_idx on public.player_career_history(user_id, started_at desc);
create index if not exists player_career_history_business_idx on public.player_career_history(business_id, started_at desc);

-- founder_progress is already the persistent progression record; Phase 3 extends it into career identity.
alter table public.founder_progress add column if not exists reputation numeric(6,2) not null default 50 check (reputation >= 0 and reputation <= 100);
alter table public.founder_progress add column if not exists market_value numeric(14,2) not null default 0 check (market_value >= 0);
alter table public.founder_progress add column if not exists career_summary jsonb not null default '{}'::jsonb;

alter table public.businesses add column if not exists company_level integer not null default 1;
alter table public.businesses drop constraint if exists businesses_company_level_check;
alter table public.businesses add constraint businesses_company_level_check check (company_level between 1 and 20);

create table if not exists public.business_open_positions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null check (role in ('cfo','cmo','coo','cto','chro')),
  title text not null,
  description text not null default '',
  minimum_experience integer not null default 0 check (minimum_experience >= 0),
  minimum_reputation numeric(6,2) not null default 0 check (minimum_reputation >= 0 and minimum_reputation <= 100),
  minimum_skill numeric(6,2) not null default 0 check (minimum_skill >= 0 and minimum_skill <= 100),
  compensation numeric(14,2) not null default 0 check (compensation >= 0),
  status text not null default 'open' check (status in ('open','filled','closed')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, role, status)
);
create index if not exists business_open_positions_role_idx on public.business_open_positions(role, status, updated_at desc);
create index if not exists business_open_positions_business_idx on public.business_open_positions(business_id, status, role);

create table if not exists public.recruitment_offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  position_id uuid not null references public.business_open_positions(id) on delete restrict,
  candidate_id uuid not null references auth.users(id) on delete cascade,
  recruiter_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('cfo','cmo','coo','cto','chro')),
  compensation numeric(14,2) not null default 0 check (compensation >= 0),
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn','expired')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create index if not exists recruitment_offers_candidate_idx on public.recruitment_offers(candidate_id, status, created_at desc);
create index if not exists recruitment_offers_business_idx on public.recruitment_offers(business_id, status, created_at desc);

alter table public.player_career_history enable row level security;
alter table public.business_open_positions enable row level security;
alter table public.recruitment_offers enable row level security;

revoke all on public.player_career_history, public.business_open_positions, public.recruitment_offers from anon;
grant select on public.player_career_history, public.business_open_positions, public.recruitment_offers to authenticated;
revoke insert, update, delete on public.player_career_history, public.business_open_positions, public.recruitment_offers from authenticated;

drop policy if exists player_career_history_select_self on public.player_career_history;
create policy player_career_history_select_self on public.player_career_history for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists business_open_positions_select_visible on public.business_open_positions;
create policy business_open_positions_select_visible on public.business_open_positions for select to authenticated using (status = 'open' or public.is_business_member(business_id));
drop policy if exists recruitment_offers_select_participant on public.recruitment_offers;
create policy recruitment_offers_select_participant on public.recruitment_offers for select to authenticated using ((select auth.uid()) = candidate_id or (select auth.uid()) = recruiter_id or public.is_business_member(business_id));

create or replace function public.get_career_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare actor uuid := (select auth.uid());
result jsonb;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  insert into public.founder_progress(user_id) values(actor) on conflict(user_id) do nothing;

  select jsonb_build_object(
    'progress', to_jsonb(fp),
    'profile', to_jsonb(p),
    'current_company', (
      select jsonb_build_object('id',b.id,'name',b.name,'industry',b.industry,'stage',b.stage,'company_level',b.company_level,'role',bm.role)
      from public.profiles p2
      join public.business_members bm on bm.business_id=p2.current_business_id and bm.user_id=actor and bm.membership_status='active'
      join public.businesses b on b.id=bm.business_id
      where p2.user_id=actor
    ),
    'history', coalesce((select jsonb_agg(jsonb_build_object(
      'id',h.id,'business_id',h.business_id,'company_name',h.company_name,'role',h.role,'started_at',h.started_at,
      'ended_at',h.ended_at,'performance_score',h.performance_score,'summary',h.summary
    ) order by h.started_at desc) from public.player_career_history h where h.user_id=actor),'[]'::jsonb),
    'offers', coalesce((select jsonb_agg(jsonb_build_object(
      'id',o.id,'business_id',o.business_id,'position_id',o.position_id,'role',o.role,'compensation',o.compensation,
      'reason',o.reason,'status',o.status,'created_at',o.created_at,'responded_at',o.responded_at,
      'company',jsonb_build_object('id',b.id,'name',b.name,'industry',b.industry,'stage',b.stage,'company_level',b.company_level),
      'position',jsonb_build_object('title',pos.title,'description',pos.description,'minimum_experience',pos.minimum_experience,'minimum_reputation',pos.minimum_reputation,'minimum_skill',pos.minimum_skill)
    ) order by o.created_at desc) from public.recruitment_offers o join public.businesses b on b.id=o.business_id join public.business_open_positions pos on pos.id=o.position_id where o.candidate_id=actor),'[]'::jsonb)
  ) into result
  from public.founder_progress fp
  left join public.profiles p on p.user_id=actor
  where fp.user_id=actor;
  return result;
end;
$$;
revoke all on function public.get_career_profile() from public, anon;
grant execute on function public.get_career_profile() to authenticated;

create or replace function public.search_recruitable_players(
  p_business_id uuid,
  p_role text,
  p_query text default ''
)
returns table(
  user_id uuid,
  display_name text,
  current_business_id uuid,
  current_company_name text,
  current_company_level integer,
  career_level integer,
  experience_points bigint,
  reputation numeric,
  role_fit numeric,
  skills jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare actor uuid := (select auth.uid());
recruiter_level integer;
q text := lower(trim(coalesce(p_query,'')));
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_role not in ('cfo','cmo','coo','cto','chro') then raise exception 'Invalid recruiting role'; end if;
  if not exists (select 1 from public.business_members where business_id=p_business_id and user_id=actor and membership_status='active' and role in ('ceo','chro')) then raise exception 'Only the CEO or People Officer can recruit'; end if;
  select company_level into recruiter_level from public.businesses where id=p_business_id;
  if recruiter_level is null then raise exception 'Company not found'; end if;

  return query
  select p.user_id,p.display_name,cur.current_business_id,cur.company_name,cur.company_level,
    fp.level,fp.xp,fp.reputation,
    greatest(
      case when p.preferred_role=p_role then 100 else 0 end,
      coalesce((fp.skills ->> p_role)::numeric,0)
    )::numeric,
    fp.skills
  from public.profiles p
  join public.founder_progress fp on fp.user_id=p.user_id
  left join lateral (
    select b.id as current_business_id,b.name as company_name,b.company_level
    from public.business_members bm join public.businesses b on b.id=bm.business_id
    where bm.user_id=p.user_id and bm.membership_status='active'
    limit 1
  ) cur on true
  where p.user_id<>actor
    and (q='' or lower(p.display_name) like '%'||q||'%')
    and (p.current_business_id is null or coalesce(cur.company_level,0) + 2 <= recruiter_level)
    and greatest(case when p.preferred_role=p_role then 100 else 0 end,coalesce((fp.skills ->> p_role)::numeric,0)) >= 60
    and fp.reputation >= 50
  order by greatest(case when p.preferred_role=p_role then 100 else 0 end,coalesce((fp.skills ->> p_role)::numeric,0)) desc, fp.reputation desc, fp.xp desc
  limit 30;
end;
$$;
revoke all on function public.search_recruitable_players(uuid,text,text) from public, anon;
grant execute on function public.search_recruitable_players(uuid,text,text) to authenticated;

create or replace function public.create_recruitment_offer(
  p_business_id uuid,
  p_candidate_id uuid,
  p_position_id uuid,
  p_compensation numeric,
  p_reason text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare actor uuid := (select auth.uid());
position_row public.business_open_positions%rowtype;
candidate_progress public.founder_progress%rowtype;
recruiting_business public.businesses%rowtype;
current_business_level integer := 0;
offer_id uuid;
role_fit numeric;
current_active_business uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_candidate_id is null or p_candidate_id=actor then raise exception 'Invalid candidate'; end if;
  if p_compensation < 0 then raise exception 'Compensation cannot be negative'; end if;
  select * into recruiting_business from public.businesses where id=p_business_id and user_id=actor for update;
  if not found then raise exception 'You do not own this company'; end if;
  select * into position_row from public.business_open_positions where id=p_position_id and business_id=p_business_id and status='open' for update;
  if not found then raise exception 'Open position not found'; end if;
  select * into candidate_progress from public.founder_progress where user_id=p_candidate_id;
  if not found then raise exception 'Candidate profile not found'; end if;
  select greatest(case when p.preferred_role=position_row.role then 100 else 0 end,coalesce((candidate_progress.skills ->> position_row.role)::numeric,0)) into role_fit from public.profiles p where p.user_id=p_candidate_id;
  if role_fit < position_row.minimum_skill then raise exception 'Candidate does not meet the role skill requirement'; end if;
  if candidate_progress.reputation < position_row.minimum_reputation then raise exception 'Candidate does not meet the reputation requirement'; end if;
  if candidate_progress.xp < position_row.minimum_experience then raise exception 'Candidate does not meet the experience requirement'; end if;
  select p.current_business_id into current_active_business from public.profiles p where p.user_id=p_candidate_id;
  if current_active_business is not null and current_active_business=p_business_id then raise exception 'Candidate is already in this company'; end if;
  if current_active_business is not null then
    select coalesce(company_level,0) into current_business_level from public.businesses where id=current_active_business;
    if recruiting_business.company_level < current_business_level + 2 then raise exception 'Recruiting company must be at least two levels above the candidate company'; end if;
  elsif recruiting_business.company_level < 2 then
    raise exception 'A company must reach Level 2 before recruiting unattached executives';
  end if;
  if exists(select 1 from public.recruitment_offers where business_id=p_business_id and candidate_id=p_candidate_id and status='pending') then raise exception 'A recruitment offer is already pending'; end if;

  insert into public.recruitment_offers(business_id,position_id,candidate_id,recruiter_id,role,compensation,reason)
  values(p_business_id,p_position_id,p_candidate_id,actor,position_row.role,p_compensation,trim(p_reason))
  returning id into offer_id;

  insert into public.notifications(user_id,type,title,body,metadata)
  values(
    p_candidate_id,
    'recruitment_offer',
    recruiting_business.name || ' wants you as ' || upper(position_row.role),
    'You have a new executive recruitment offer. Review the company, role and career impact before deciding.',
    jsonb_build_object('offer_id',offer_id,'business_id',p_business_id,'position_id',p_position_id,'role',position_row.role,'compensation',p_compensation)
  );
  return offer_id;
end;
$$;
revoke all on function public.create_recruitment_offer(uuid,uuid,uuid,numeric,text) from public, anon;
grant execute on function public.create_recruitment_offer(uuid,uuid,uuid,numeric,text) to authenticated;

create or replace function public.respond_recruitment_offer(p_offer_id uuid,p_action text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare actor uuid := (select auth.uid());
offer public.recruitment_offers%rowtype;
new_company public.businesses%rowtype;
old_business_id uuid;
old_role text;
limit_count integer;
participant_count integer;
business_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_action not in ('accept','decline') then raise exception 'Invalid recruitment response'; end if;
  select * into offer from public.recruitment_offers where id=p_offer_id and candidate_id=actor and status='pending' for update;
  if not found then raise exception 'Recruitment offer not found or no longer pending'; end if;
  if p_action='decline' then
    update public.recruitment_offers set status='declined',responded_at=now() where id=offer.id;
    insert into public.notifications(user_id,type,title,body,metadata)
    values(offer.recruiter_id,'recruitment_response','Recruitment offer declined','The candidate declined your executive offer.',jsonb_build_object('offer_id',offer.id));
    return offer.business_id;
  end if;

  select * into new_company from public.businesses where id=offer.business_id for update;
  if not found then raise exception 'Company no longer exists'; end if;
  limit_count := public.business_participant_limit(new_company.team_size);
  select count(*) into participant_count from public.business_members where business_id=offer.business_id and membership_status='active';
  if limit_count is not null and participant_count >= limit_count then raise exception 'The recruiting company has no available participant capacity'; end if;

  select current_business_id,active_role into old_business_id,old_role from public.profiles where user_id=actor for update;
  if old_business_id is not null then
    update public.business_members set membership_status='ended',left_at=now() where business_id=old_business_id and user_id=actor and membership_status='active';
    insert into public.player_career_history(user_id,business_id,company_name,role,started_at,ended_at,summary)
    select actor,b.id,b.name,coalesce(old_role,'member'),coalesce(bm.joined_at,now()),now(),'Moved to a new enterprise through a recruitment offer.'
    from public.businesses b left join public.business_members bm on bm.business_id=b.id and bm.user_id=actor where b.id=old_business_id;
  end if;

  insert into public.business_members(business_id,user_id,role,membership_status)
  values(offer.business_id,actor,offer.role,'active')
  on conflict(business_id,user_id) do update set role=excluded.role,membership_status='active',left_at=null;

  insert into public.player_career_history(user_id,business_id,company_name,role,summary)
  values(actor,offer.business_id,new_company.name,offer.role,'Joined through a verified EnterpriseVerse recruitment offer.');

  update public.profiles set current_business_id=offer.business_id,active_role=offer.role,onboarding_path='executive',preferred_role=offer.role,onboarding_completed=true,updated_at=now() where user_id=actor;
  update public.recruitment_offers set status='accepted',responded_at=now() where id=offer.id;

  insert into public.notifications(user_id,type,title,body,metadata)
  values(offer.recruiter_id,'recruitment_response','Executive offer accepted','Your recruitment offer was accepted. The executive has joined your company.',jsonb_build_object('offer_id',offer.id,'business_id',offer.business_id,'role',offer.role));
  return offer.business_id;
end;
$$;
revoke all on function public.respond_recruitment_offer(uuid,text) from public, anon;
grant execute on function public.respond_recruitment_offer(uuid,text) to authenticated;

create or replace function public.get_notification_center(p_limit integer default 50)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'notifications', coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'type',n.type,'title',n.title,'body',n.body,'read_at',n.read_at,'metadata',n.metadata,'created_at',n.created_at) order by n.created_at desc) from public.notifications n where n.user_id=(select auth.uid()) limit greatest(1,least(coalesce(p_limit,50),100))),'[]'::jsonb),
    'unread_count', (select count(*) from public.notifications n where n.user_id=(select auth.uid()) and n.read_at is null)
  );
$$;
revoke all on function public.get_notification_center(integer) from public, anon;
grant execute on function public.get_notification_center(integer) to authenticated;

create or replace function public.mark_notification_center_read(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  update public.notifications set read_at=coalesce(read_at,now()) where id=p_notification_id and user_id=(select auth.uid());
  return found;
end;
$$;
revoke all on function public.mark_notification_center_read(uuid) from public, anon;
grant execute on function public.mark_notification_center_read(uuid) to authenticated;

-- Role-aware default positions for companies that have an executive team.
insert into public.business_open_positions(business_id,role,title,description,created_by)
select b.id,v.role,v.title,v.description,b.user_id
from public.businesses b
cross join (values
  ('cfo','Finance Officer / CFO','Own finance, budgets, liquidity and funding.'),
  ('cmo','Marketing Officer / CMO','Own customers, campaigns, pricing and growth.'),
  ('coo','Operations Officer / COO','Own production, inventory, capacity and supply chain.'),
  ('cto','Technology Officer / CTO','Own product, technology, R&D and innovation.'),
  ('chro','People Officer / CHRO','Own hiring, productivity, morale and culture.')
) v(role,title,description)
where b.user_id is not null
on conflict (business_id, role, status) do nothing;

-- Unify company invitation delivery with the same notification center.
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
declare actor uuid := (select auth.uid());
business_row public.businesses%rowtype;
limit_count integer;
participant_count integer;
invitation_id uuid;
role_title text;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_business_id is null or p_invitee_id is null then raise exception 'Business and invitee are required'; end if;
  if actor=p_invitee_id then raise exception 'You cannot invite yourself'; end if;
  if p_requested_role not in ('cfo','cmo','coo','cto','chro','founder') then raise exception 'Invalid requested role'; end if;
  select * into business_row from public.businesses where id=p_business_id and user_id=actor for update;
  if not found then raise exception 'You do not own this enterprise'; end if;
  limit_count := public.business_participant_limit(business_row.team_size);
  select count(*) into participant_count from public.business_members where business_id=p_business_id and membership_status='active';
  if limit_count is not null and participant_count>=limit_count then raise exception 'This enterprise has reached its participant limit'; end if;
  if exists(select 1 from public.business_members where business_id=p_business_id and user_id=p_invitee_id and membership_status='active') then raise exception 'That user is already a participant'; end if;
  if exists(select 1 from public.business_invitations where business_id=p_business_id and invitee_id=p_invitee_id and status='pending') then raise exception 'An invitation is already pending for that user'; end if;
  insert into public.business_invitations(business_id,inviter_id,invitee_id,requested_role)
  values(p_business_id,actor,p_invitee_id,p_requested_role)
  returning id into invitation_id;
  role_title := case p_requested_role when 'cfo' then 'CFO' when 'cmo' then 'CMO' when 'coo' then 'COO' when 'cto' then 'CTO' when 'chro' then 'CHRO' else 'Co-founder' end;
  insert into public.notifications(user_id,type,title,body,metadata)
  values(p_invitee_id,'company_invitation',business_row.name || ' invited you to join','You have been invited to join as '||role_title||'.',jsonb_build_object('invitation_id',invitation_id,'business_id',p_business_id,'requested_role',p_requested_role));
  return invitation_id;
end;
$$;
revoke all on function public.send_business_invitation(uuid,uuid,text) from public, anon;
grant execute on function public.send_business_invitation(uuid,uuid,text) to authenticated;

-- Keep enterprise membership/current-company context synchronized when an invitation is accepted.
create or replace function public.accept_business_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare actor uuid := (select auth.uid());
invite public.business_invitations%rowtype;
business_row public.businesses%rowtype;
limit_count integer;
participant_count integer;
assigned_role text;
old_business_id uuid;
old_role text;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into invite from public.business_invitations where id=p_invitation_id and invitee_id=actor and status='pending' for update;
  if not found then raise exception 'Invitation not found or no longer pending'; end if;
  select * into business_row from public.businesses where id=invite.business_id for update;
  if not found then raise exception 'Enterprise no longer exists'; end if;
  limit_count := public.business_participant_limit(business_row.team_size);
  select count(*) into participant_count from public.business_members where business_id=invite.business_id and membership_status='active';
  if limit_count is not null and participant_count>=limit_count then update public.business_invitations set status='expired',responded_at=now() where id=invite.id; raise exception 'This enterprise has reached its participant limit'; end if;
  select current_business_id,active_role into old_business_id,old_role from public.profiles where user_id=actor for update;
  if old_business_id is not null and old_business_id<>invite.business_id then
    update public.business_members set membership_status='ended',left_at=now() where business_id=old_business_id and user_id=actor and membership_status='active';
    insert into public.player_career_history(user_id,business_id,company_name,role,started_at,ended_at,summary)
    select actor,b.id,b.name,coalesce(old_role,'member'),coalesce(bm.joined_at,now()),now(),'Moved to a new enterprise through a company invitation.'
    from public.businesses b left join public.business_members bm on bm.business_id=b.id and bm.user_id=actor where b.id=old_business_id;
  end if;
  assigned_role := case when invite.requested_role='founder' then 'founder' else invite.requested_role end;
  insert into public.business_members(business_id,user_id,role,membership_status) values(invite.business_id,actor,assigned_role,'active') on conflict(business_id,user_id) do update set role=excluded.role,membership_status='active',left_at=null;
  update public.business_invitations set status='accepted',responded_at=now() where id=invite.id;
  insert into public.profiles(user_id,onboarding_path,preferred_role,current_business_id,active_role,onboarding_completed)
  values(actor,'executive',nullif(invite.requested_role,'founder'),invite.business_id,case when invite.requested_role='founder' then null else invite.requested_role end,true)
  on conflict(user_id) do update set onboarding_path='executive',preferred_role=nullif(invite.requested_role,'founder'),current_business_id=invite.business_id,active_role=case when invite.requested_role='founder' then null else invite.requested_role end,onboarding_completed=true,updated_at=now();
  insert into public.player_career_history(user_id,business_id,company_name,role,summary) values(actor,invite.business_id,business_row.name,assigned_role,'Joined through an EnterpriseVerse company invitation.');
  insert into public.notifications(user_id,type,title,body,metadata) values(invite.inviter_id,'company_invitation_response','Invitation accepted','Your company invitation was accepted.',jsonb_build_object('invitation_id',invite.id,'business_id',invite.business_id,'role',assigned_role));
  return invite.business_id;
end;
$$;
revoke all on function public.accept_business_invitation(uuid) from public, anon;
grant execute on function public.accept_business_invitation(uuid) to authenticated;
