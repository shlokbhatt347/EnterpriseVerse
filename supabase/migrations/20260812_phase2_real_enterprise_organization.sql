-- Phase 2: real enterprise organization, departments, proposals, approvals and audit events.

create table if not exists public.business_departments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  department_key text not null,
  name text not null,
  description text not null default '',
  leader_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, department_key)
);

create table if not exists public.business_org_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  approval_model text not null default 'centralized' check (approval_model in ('centralized','delegated')),
  finance_review_threshold numeric(14,2) not null default 25000 check (finance_review_threshold >= 0),
  ceo_approval_threshold numeric(14,2) not null default 100000 check (ceo_approval_threshold >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_proposals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete restrict,
  department_key text not null,
  proposal_type text not null,
  title text not null,
  description text not null default '',
  amount numeric(14,2) not null default 0 check (amount >= 0),
  expected_impact jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('draft','submitted','needs_changes','approved','rejected','executed','cancelled')),
  current_step integer not null default 1 check (current_step >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_proposal_steps (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.business_proposals(id) on delete cascade,
  step_order integer not null check (step_order >= 1),
  required_role text not null check (required_role in ('ceo','cfo','cmo','coo','cto','chro')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','needs_changes')),
  reviewer_id uuid references auth.users(id) on delete set null,
  note text,
  acted_at timestamptz,
  unique (proposal_id, step_order)
);

create table if not exists public.business_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_departments_business_idx on public.business_departments(business_id, department_key);
create index if not exists business_departments_leader_idx on public.business_departments(leader_user_id);
create index if not exists business_proposals_business_status_idx on public.business_proposals(business_id, status, updated_at desc);
create index if not exists business_proposals_creator_idx on public.business_proposals(creator_id, created_at desc);
create index if not exists business_proposal_steps_pending_idx on public.business_proposal_steps(proposal_id, step_order, status);
create index if not exists business_events_business_idx on public.business_events(business_id, created_at desc);

alter table public.business_departments enable row level security;
alter table public.business_org_settings enable row level security;
alter table public.business_proposals enable row level security;
alter table public.business_proposal_steps enable row level security;
alter table public.business_events enable row level security;

revoke all on public.business_departments, public.business_org_settings, public.business_proposals, public.business_proposal_steps, public.business_events from anon;
grant select on public.business_departments, public.business_org_settings, public.business_proposals, public.business_proposal_steps, public.business_events to authenticated;
revoke insert, update, delete on public.business_departments, public.business_org_settings, public.business_proposals, public.business_proposal_steps, public.business_events from authenticated;

drop policy if exists business_departments_select_member on public.business_departments;
create policy business_departments_select_member on public.business_departments for select to authenticated
using ((select public.is_business_member(business_id)));

drop policy if exists business_org_settings_select_member on public.business_org_settings;
create policy business_org_settings_select_member on public.business_org_settings for select to authenticated
using ((select public.is_business_member(business_id)));

drop policy if exists business_proposals_select_member on public.business_proposals;
create policy business_proposals_select_member on public.business_proposals for select to authenticated
using ((select public.is_business_member(business_id)));

drop policy if exists business_proposal_steps_select_member on public.business_proposal_steps;
create policy business_proposal_steps_select_member on public.business_proposal_steps for select to authenticated
using (exists (select 1 from public.business_proposals p where p.id = proposal_id and public.is_business_member(p.business_id)));

drop policy if exists business_events_select_member on public.business_events;
create policy business_events_select_member on public.business_events for select to authenticated
using ((select public.is_business_member(business_id)));

-- Seed organization structure for existing and future enterprises.
insert into public.business_departments (business_id, department_key, name, description)
select b.id, v.department_key, v.name, v.description
from public.businesses b
cross join (values
  ('finance','Finance','Cash, budgets, funding and financial analysis.'),
  ('marketing','Marketing','Customers, campaigns, pricing and growth.'),
  ('operations','Operations','Production, inventory, capacity and supply chain.'),
  ('technology','Technology','Product, technology, R&D and innovation.'),
  ('people','People','Hiring, productivity, morale and culture.')
) as v(department_key,name,description)
on conflict (business_id, department_key) do nothing;

insert into public.business_org_settings (business_id)
select b.id from public.businesses b
on conflict (business_id) do nothing;

-- Keep the company owner as CEO and finance/marketing/operations leaders as members when already assigned.
update public.business_departments d
set leader_user_id = bm.user_id, updated_at = now()
from public.business_members bm
where bm.business_id = d.business_id
  and bm.role = case d.department_key
    when 'finance' then 'cfo'
    when 'marketing' then 'cmo'
    when 'operations' then 'coo'
    when 'technology' then 'cto'
    when 'people' then 'chro'
    else 'member'
  end;

create or replace function public.get_company_workspace(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  result jsonb;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_business_id is null or not public.is_business_member(p_business_id) then raise exception 'You are not a member of this company'; end if;

  select jsonb_build_object(
    'business', to_jsonb(b),
    'membership', (
      select to_jsonb(bm) from public.business_members bm where bm.business_id = b.id and bm.user_id = actor
    ),
    'members', coalesce((select jsonb_agg(jsonb_build_object(
      'user_id', bm.user_id,
      'display_name', coalesce(p.display_name, 'Founder'),
      'role', bm.role,
      'joined_at', bm.joined_at
    ) order by case bm.role when 'ceo' then 0 when 'cfo' then 1 when 'cmo' then 2 when 'coo' then 3 when 'cto' then 4 when 'chro' then 5 else 6 end, bm.joined_at)
    from public.business_members bm left join public.profiles p on p.user_id = bm.user_id where bm.business_id = b.id), '[]'::jsonb),
    'departments', coalesce((select jsonb_agg(to_jsonb(d) order by d.department_key) from public.business_departments d where d.business_id = b.id), '[]'::jsonb),
    'settings', (select to_jsonb(s) from public.business_org_settings s where s.business_id = b.id),
    'proposals', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p2.id, 'creator_id', p2.creator_id, 'creator_name', coalesce(cp.display_name, 'Founder'),
      'department_key', p2.department_key, 'proposal_type', p2.proposal_type, 'title', p2.title,
      'description', p2.description, 'amount', p2.amount, 'expected_impact', p2.expected_impact,
      'status', p2.status, 'current_step', p2.current_step, 'created_at', p2.created_at, 'updated_at', p2.updated_at,
      'steps', coalesce((select jsonb_agg(to_jsonb(ps) order by ps.step_order) from public.business_proposal_steps ps where ps.proposal_id = p2.id), '[]'::jsonb)
    ) order by p2.updated_at desc)
    from public.business_proposals p2 left join public.profiles cp on cp.user_id = p2.creator_id where p2.business_id = b.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id,'actor_id',e.actor_id,'event_type',e.event_type,'summary',e.summary,'metadata',e.metadata,'created_at',e.created_at) order by e.created_at desc)
      from public.business_events e where e.business_id = b.id order by e.created_at desc limit 30), '[]'::jsonb)
  ) into result
  from public.businesses b where b.id = p_business_id;
  return result;
end;
$$;
revoke all on function public.get_company_workspace(uuid) from public, anon;
grant execute on function public.get_company_workspace(uuid) to authenticated;

create or replace function public.create_business_proposal(
  p_business_id uuid,
  p_department_key text,
  p_proposal_type text,
  p_title text,
  p_description text default '',
  p_amount numeric default 0,
  p_expected_impact jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  member_role text;
  settings_row public.business_org_settings%rowtype;
  proposal_id uuid;
  step_counter integer := 1;
  needs_cfo boolean;
  needs_ceo boolean;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not public.is_business_member(p_business_id) then raise exception 'You are not a member of this company'; end if;
  if length(trim(p_title)) < 3 or length(trim(p_title)) > 160 then raise exception 'Proposal title must be between 3 and 160 characters'; end if;
  if p_amount < 0 then raise exception 'Proposal amount cannot be negative'; end if;
  if p_department_key not in ('finance','marketing','operations','technology','people') then raise exception 'Invalid department'; end if;

  select role into member_role from public.business_members where business_id = p_business_id and user_id = actor;
  if member_role not in ('ceo','cfo','cmo','coo','cto','chro') then raise exception 'Only executives can create organization proposals'; end if;

  select * into settings_row from public.business_org_settings where business_id = p_business_id;
  needs_cfo := p_department_key <> 'finance' and p_amount >= settings_row.finance_review_threshold;
  needs_ceo := member_role <> 'ceo' or p_amount >= settings_row.ceo_approval_threshold;

  if needs_cfo then needs_ceo := true; end if;

  insert into public.business_proposals(business_id,creator_id,department_key,proposal_type,title,description,amount,expected_impact,status,current_step)
  values(p_business_id,actor,p_department_key,p_proposal_type,trim(p_title),trim(p_description),p_amount,coalesce(p_expected_impact,'{}'::jsonb),'submitted',1)
  returning id into proposal_id;

  -- Finance review is the default cross-functional gate for material spend.
  if needs_cfo then
    insert into public.business_proposal_steps(proposal_id,step_order,required_role) values(proposal_id,step_counter,'cfo');
    step_counter := step_counter + 1;
  end if;
  if needs_ceo then
    insert into public.business_proposal_steps(proposal_id,step_order,required_role) values(proposal_id,step_counter,'ceo');
  end if;

  if not needs_cfo and not needs_ceo then
    update public.business_proposals set status='approved', current_step=1, updated_at=now() where id=proposal_id;
    insert into public.business_events(business_id,actor_id,event_type,summary,metadata) values(p_business_id,actor,'proposal_auto_approved','Proposal auto-approved under current delegated authority',jsonb_build_object('proposal_id',proposal_id));
  else
    insert into public.business_events(business_id,actor_id,event_type,summary,metadata) values(p_business_id,actor,'proposal_submitted','New business proposal submitted',jsonb_build_object('proposal_id',proposal_id,'department',p_department_key,'amount',p_amount));
  end if;

  return proposal_id;
end;
$$;
revoke all on function public.create_business_proposal(uuid,text,text,text,text,numeric,jsonb) from public, anon;
grant execute on function public.create_business_proposal(uuid,text,text,text,text,numeric,jsonb) to authenticated;

create or replace function public.act_on_business_proposal(
  p_proposal_id uuid,
  p_action text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  proposal public.business_proposals%rowtype;
  step public.business_proposal_steps%rowtype;
  actor_role text;
  next_status text;
  next_step integer;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_action not in ('approve','reject','request_changes') then raise exception 'Invalid proposal action'; end if;

  select * into proposal from public.business_proposals where id = p_proposal_id for update;
  if not found or not public.is_business_member(proposal.business_id) then raise exception 'Proposal not found'; end if;
  if proposal.status not in ('submitted','needs_changes') then raise exception 'This proposal is no longer awaiting a decision'; end if;

  select * into step from public.business_proposal_steps where proposal_id = proposal.id and step_order = proposal.current_step for update;
  if not found then raise exception 'Approval step is missing'; end if;

  select role into actor_role from public.business_members where business_id = proposal.business_id and user_id = actor;
  if actor_role <> step.required_role then raise exception 'This proposal is not waiting for your role'; end if;

  next_status := case p_action when 'reject' then 'rejected' when 'request_changes' then 'needs_changes' else 'approved' end;
  update public.business_proposal_steps set status = next_status, reviewer_id = actor, note = nullif(trim(coalesce(p_note,'')),''), acted_at = now() where id = step.id;

  if p_action = 'reject' then
    update public.business_proposals set status='rejected', updated_at=now() where id=proposal.id;
  elsif p_action = 'request_changes' then
    update public.business_proposals set status='needs_changes', updated_at=now() where id=proposal.id;
  else
    select step_order into next_step from public.business_proposal_steps where proposal_id=proposal.id and step_order > proposal.current_step order by step_order asc limit 1;
    if next_step is null then
      update public.business_proposals set status='approved', updated_at=now() where id=proposal.id;
    else
      update public.business_proposals set status='submitted', current_step=next_step, updated_at=now() where id=proposal.id;
    end if;
  end if;

  insert into public.business_events(business_id,actor_id,event_type,summary,metadata)
  values(proposal.business_id,actor,concat('proposal_',p_action),'Proposal updated by approver',jsonb_build_object('proposal_id',proposal.id,'role',actor_role,'note',p_note));

  return jsonb_build_object('proposal_id',proposal.id,'status',(select status from public.business_proposals where id=proposal.id),'current_step',(select current_step from public.business_proposals where id=proposal.id));
end;
$$;
revoke all on function public.act_on_business_proposal(uuid,text,text) from public, anon;
grant execute on function public.act_on_business_proposal(uuid,text,text) to authenticated;

-- Phase 2 automatically seeds executive departments whenever a new company is created.
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
declare actor uuid := (select auth.uid()); business_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_team_size not in ('solo','pair','trio','company') then raise exception 'Invalid enterprise size'; end if;
  if length(trim(p_name)) < 1 or length(trim(p_name)) > 120 then raise exception 'Invalid enterprise name'; end if;

  insert into public.businesses(user_id,name,industry,team_size,metadata)
  values(actor,trim(p_name),nullif(trim(p_industry),''),p_team_size,coalesce(p_metadata,'{}'::jsonb))
  returning id into business_id;

  insert into public.business_members(business_id,user_id,role) values(business_id,actor,'ceo');
  insert into public.business_org_settings(business_id) values(business_id) on conflict do nothing;
  insert into public.business_departments(business_id,department_key,name,description) values
    (business_id,'finance','Finance','Cash, budgets, funding and financial analysis.'),
    (business_id,'marketing','Marketing','Customers, campaigns, pricing and growth.'),
    (business_id,'operations','Operations','Production, inventory, capacity and supply chain.'),
    (business_id,'technology','Technology','Product, technology, R&D and innovation.'),
    (business_id,'people','People','Hiring, productivity, morale and culture.')
  on conflict (business_id,department_key) do nothing;

  insert into public.business_events(business_id,actor_id,event_type,summary,metadata)
  values(business_id,actor,'company_founded','Company founded by CEO',jsonb_build_object('team_size',p_team_size,'industry',p_industry));

  return business_id;
end;
$$;
revoke all on function public.create_enterprise(text,text,text,jsonb) from public, anon;
grant execute on function public.create_enterprise(text,text,text,jsonb) to authenticated;
