-- EnterpriseVerse Infinity SQL hardening: eliminate ambiguous PL/pgSQL names,
-- remove the obsolete overloaded invitation RPC, and add justified FK indexes.

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
  v_business_id uuid;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;
  if p_team_size not in ('solo','pair','trio','company') then
    raise exception 'Invalid enterprise size';
  end if;
  if length(trim(p_name)) < 1 or length(trim(p_name)) > 120 then
    raise exception 'Invalid enterprise name';
  end if;

  insert into public.businesses(user_id, name, industry, team_size, metadata)
  values (actor, trim(p_name), nullif(trim(p_industry), ''), p_team_size, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_business_id;

  insert into public.business_members(business_id, user_id, role)
  values (v_business_id, actor, 'ceo');

  insert into public.business_org_settings(business_id)
  values (v_business_id)
  on conflict (business_id) do nothing;

  insert into public.business_departments(business_id, department_key, name, description)
  values
    (v_business_id, 'finance', 'Finance', 'Cash, budgets, funding and financial analysis.'),
    (v_business_id, 'marketing', 'Marketing', 'Customers, campaigns, pricing and growth.'),
    (v_business_id, 'operations', 'Operations', 'Production, inventory, capacity and supply chain.'),
    (v_business_id, 'technology', 'Technology', 'Product, technology, R&D and innovation.'),
    (v_business_id, 'people', 'People', 'Hiring, productivity, morale and culture.')
  on conflict (business_id, department_key) do nothing;

  insert into public.business_events(business_id, actor_id, event_type, summary, metadata)
  values (
    v_business_id,
    actor,
    'company_founded',
    'Company founded by CEO',
    jsonb_build_object('team_size', p_team_size, 'industry', p_industry)
  );

  return v_business_id;
end;
$$;

revoke all on function public.create_enterprise(text, text, text, jsonb) from public, anon;
grant execute on function public.create_enterprise(text, text, text, jsonb) to authenticated;

-- The role-aware three-argument invitation RPC is the canonical API.
-- Remove the obsolete two-argument overload so PostgREST cannot resolve
-- the invitation contract inconsistently.
drop function if exists public.send_business_invitation(uuid, uuid);

-- Cover the foreign keys used by company timelines and proposal reviewer lookups.
create index if not exists business_events_actor_id_idx
  on public.business_events(actor_id);

create index if not exists business_proposal_steps_reviewer_id_idx
  on public.business_proposal_steps(reviewer_id);

-- Keep a single leaderboard ordering index.
drop index if exists public.leaderboard_scope_score_idx;
create index if not exists leaderboard_scores_scope_score_idx
  on public.leaderboard_scores(scope, score desc, achieved_at asc);

-- Read-only season metadata does not require elevated privileges because
-- authenticated users already have SELECT through RLS.
create or replace function public.get_active_phase7_season()
returns table(
  id uuid,
  season_key text,
  name text,
  theme text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select s.id, s.season_key, s.name, s.theme, s.status, s.starts_at, s.ends_at
  from public.phase7_seasons as s
  where s.status = 'active'
  order by s.starts_at desc
  limit 1;
$$;
revoke all on function public.get_active_phase7_season() from public, anon;
grant execute on function public.get_active_phase7_season() to authenticated;
