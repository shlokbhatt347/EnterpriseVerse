-- EnterpriseVerse Phase 28 — Production schema reconciliation
-- Idempotent reconciliation for the hosted Supabase project.
-- This migration captures the Phase 22 competition schema plus the
-- production tables already used by Phases 23–27 so a fresh environment
-- can reproduce the database contract instead of relying on dashboard-only DDL.

create extension if not exists pgcrypto;

-- Phase 23–27 application tables.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  industry text,
  stage text not null default 'startup' check (stage in ('startup','growth','established','leader')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  skills jsonb not null default '{}'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_concepts (
  concept_key text primary key,
  title text not null,
  description text not null default '',
  curriculum_area text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.achievement_catalog (
  achievement_key text primary key,
  title text not null,
  description text not null default '',
  xp_reward integer not null default 0 check (xp_reward >= 0),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '',
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  event_name text not null check (char_length(event_name) between 1 and 120),
  session_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.simulation_runs
  add column if not exists business_id uuid references public.businesses(id) on delete set null;

create index if not exists businesses_user_updated_idx on public.businesses(user_id, updated_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index if not exists analytics_events_user_time_idx on public.analytics_events(user_id, occurred_at desc);
create index if not exists analytics_events_name_time_idx on public.analytics_events(event_name, occurred_at desc);
create index if not exists simulation_runs_business_idx on public.simulation_runs(business_id);

-- Phase 22 multiplayer/competition schema.
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create table if not exists public.competition_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  competition_type text not null default 'friends_only' check (competition_type in ('friends_only','private','quick_match','classroom')),
  status text not null default 'lobby' check (status in ('lobby','active','completed','cancelled')),
  max_players integer not null default 4 check (max_players between 2 and 8),
  duration_rounds integer not null default 30 check (duration_rounds between 5 and 90),
  current_round integer not null default 1 check (current_round between 1 and 91),
  world_seed bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competition_players (
  room_id uuid not null references public.competition_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  ready boolean not null default false,
  connected boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.competition_submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.competition_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  round integer not null check (round >= 1),
  decision_id text not null check (char_length(decision_id) between 1 and 120),
  submitted_at timestamptz not null default now(),
  unique (room_id, user_id, round)
);

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid references public.competition_rooms(id) on delete set null,
  scope text not null check (scope in ('global','friends','weekly','monthly','scenario')),
  scenario_key text,
  score numeric(12,2) not null check (score >= 0),
  rank integer,
  metrics jsonb not null default '{}'::jsonb,
  achieved_at timestamptz not null default now()
);

create index if not exists friendships_requester_idx on public.friendships(requester_id, status);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id, status);
create index if not exists competition_rooms_status_idx on public.competition_rooms(status, updated_at desc);
create index if not exists competition_players_user_idx on public.competition_players(user_id);
create index if not exists competition_submissions_room_round_idx on public.competition_submissions(room_id, round);
create index if not exists leaderboard_scope_score_idx on public.leaderboard_scores(scope, score desc, achieved_at asc);
create index if not exists leaderboard_user_idx on public.leaderboard_scores(user_id, scope, score desc);

-- Keep updated_at maintenance deterministic.
create or replace function public.phase28_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at before update on public.businesses for each row execute function public.phase28_updated_at();
drop trigger if exists founder_progress_set_updated_at on public.founder_progress;
create trigger founder_progress_set_updated_at before update on public.founder_progress for each row execute function public.phase28_updated_at();
drop trigger if exists friendships_updated_at on public.friendships;
create trigger friendships_updated_at before update on public.friendships for each row execute function public.phase28_updated_at();
drop trigger if exists competition_rooms_updated_at on public.competition_rooms;
create trigger competition_rooms_updated_at before update on public.competition_rooms for each row execute function public.phase28_updated_at();

-- RLS is mandatory on every browser-exposed public table.
alter table public.businesses enable row level security;
alter table public.founder_progress enable row level security;
alter table public.learning_concepts enable row level security;
alter table public.achievement_catalog enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics_events enable row level security;
alter table public.friendships enable row level security;
alter table public.competition_rooms enable row level security;
alter table public.competition_players enable row level security;
alter table public.competition_submissions enable row level security;
alter table public.leaderboard_scores enable row level security;

-- User-owned data.
drop policy if exists businesses_all_own on public.businesses;
create policy businesses_all_own on public.businesses for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists founder_progress_all_own on public.founder_progress;
create policy founder_progress_all_own on public.founder_progress for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists notifications_all_own on public.notifications;
create policy notifications_all_own on public.notifications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own on public.analytics_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists analytics_events_select_own on public.analytics_events;
create policy analytics_events_select_own on public.analytics_events for select to authenticated
  using ((select auth.uid()) = user_id);

-- Reference data is read-only from the browser.
drop policy if exists learning_concepts_read_authenticated on public.learning_concepts;
create policy learning_concepts_read_authenticated on public.learning_concepts for select to authenticated using (true);
drop policy if exists achievement_catalog_read_authenticated on public.achievement_catalog;
create policy achievement_catalog_read_authenticated on public.achievement_catalog for select to authenticated using (true);

-- Competition privacy.
drop policy if exists friendships_select_participant on public.friendships;
create policy friendships_select_participant on public.friendships for select to authenticated using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);
drop policy if exists friendships_insert_requester on public.friendships;
create policy friendships_insert_requester on public.friendships for insert to authenticated with check ((select auth.uid()) = requester_id);
drop policy if exists friendships_update_participant on public.friendships;
create policy friendships_update_participant on public.friendships for update to authenticated using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id) with check ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);
drop policy if exists friendships_delete_participant on public.friendships;
create policy friendships_delete_participant on public.friendships for delete to authenticated using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

drop policy if exists competition_rooms_select_authenticated on public.competition_rooms;
create policy competition_rooms_select_authenticated on public.competition_rooms for select to authenticated using (status = 'lobby' or host_id = (select auth.uid()) or exists (select 1 from public.competition_players p where p.room_id = competition_rooms.id and p.user_id = (select auth.uid())));
drop policy if exists competition_rooms_insert_host on public.competition_rooms;
create policy competition_rooms_insert_host on public.competition_rooms for insert to authenticated with check ((select auth.uid()) = host_id);
drop policy if exists competition_rooms_update_host on public.competition_rooms;
create policy competition_rooms_update_host on public.competition_rooms for update to authenticated using ((select auth.uid()) = host_id) with check ((select auth.uid()) = host_id);

drop policy if exists competition_players_select_authenticated on public.competition_players;
create policy competition_players_select_authenticated on public.competition_players for select to authenticated using (user_id = (select auth.uid()) or exists (select 1 from public.competition_players me where me.room_id = competition_players.room_id and me.user_id = (select auth.uid())));
drop policy if exists competition_players_insert_self on public.competition_players;
create policy competition_players_insert_self on public.competition_players for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists competition_players_update_self on public.competition_players;
create policy competition_players_update_self on public.competition_players for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists competition_players_delete_self on public.competition_players;
create policy competition_players_delete_self on public.competition_players for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists competition_submissions_select_own on public.competition_submissions;
create policy competition_submissions_select_own on public.competition_submissions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists competition_submissions_insert_self on public.competition_submissions;
create policy competition_submissions_insert_self on public.competition_submissions for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.competition_players p where p.room_id = competition_submissions.room_id and p.user_id = (select auth.uid())));

drop policy if exists leaderboard_scores_select_authenticated on public.leaderboard_scores;
create policy leaderboard_scores_select_authenticated on public.leaderboard_scores for select to authenticated using (true);

-- Least-privilege browser grants. The anon role receives no application-table access.
revoke all on public.businesses, public.founder_progress, public.learning_concepts, public.achievement_catalog,
  public.notifications, public.analytics_events, public.friendships, public.competition_rooms,
  public.competition_players, public.competition_submissions, public.leaderboard_scores from anon;
grant select, insert, update, delete on public.businesses, public.founder_progress, public.notifications, public.friendships, public.competition_players, public.competition_submissions to authenticated;
grant select on public.learning_concepts, public.achievement_catalog, public.leaderboard_scores to authenticated;
grant insert, select on public.analytics_events to authenticated;

-- The user-created profile trigger is callable only by the database trigger path.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Competition round/scoring RPCs are the only browser entry points for privileged scoring/progression.
create or replace function public.phase22_score(p_user_id uuid,p_room_id uuid,p_scope text,p_score numeric,p_metrics jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then raise exception 'Not authorized'; end if;
  if p_scope not in ('global','friends','weekly','monthly','scenario') then raise exception 'Invalid leaderboard scope'; end if;
  if p_score < 0 or p_score > 100000000 then raise exception 'Invalid score'; end if;
  if p_room_id is not null and not exists (select 1 from public.competition_players where room_id=p_room_id and user_id=(select auth.uid())) then raise exception 'Player is not in this room'; end if;
  insert into public.leaderboard_scores(user_id,room_id,scope,score,metrics) values (p_user_id,p_room_id,p_scope,round(p_score,2),coalesce(p_metrics,'{}'::jsonb)) returning id into new_id;
  return new_id;
end; $$;
revoke all on function public.phase22_score(uuid,uuid,text,numeric,jsonb) from public;
grant execute on function public.phase22_score(uuid,uuid,text,numeric,jsonb) to authenticated;

create or replace function public.phase22_submit_decision(p_room_id uuid,p_round integer,p_decision_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_room public.competition_rooms%rowtype; player_count integer; submission_count integer; next_round integer; completed boolean := false;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if p_round < 1 or char_length(p_decision_id) < 1 or char_length(p_decision_id) > 120 then raise exception 'Invalid decision'; end if;
  select * into current_room from public.competition_rooms where id=p_room_id for update;
  if not found then raise exception 'Competition room not found'; end if;
  if current_room.status <> 'active' then raise exception 'Competition is not active'; end if;
  if current_room.current_round <> p_round then raise exception 'This round is no longer active'; end if;
  if not exists (select 1 from public.competition_players where room_id=p_room_id and user_id=(select auth.uid())) then raise exception 'Player is not in this room'; end if;
  insert into public.competition_submissions(room_id,user_id,round,decision_id) values (p_room_id,(select auth.uid()),p_round,p_decision_id) on conflict (room_id,user_id,round) do nothing;
  if not exists (select 1 from public.competition_submissions where room_id=p_room_id and user_id=(select auth.uid()) and round=p_round) then raise exception 'Decision was not recorded'; end if;
  select count(*) into player_count from public.competition_players where room_id=p_room_id;
  select count(*) into submission_count from public.competition_submissions where room_id=p_room_id and round=p_round;
  next_round:=current_room.current_round;
  if submission_count >= player_count then
    if current_room.current_round >= current_room.duration_rounds then
      update public.competition_rooms set status='completed', current_round=current_room.current_round where id=p_room_id; completed:=true;
    else
      next_round:=current_room.current_round+1; update public.competition_rooms set current_round=next_round where id=p_room_id;
    end if;
  end if;
  return jsonb_build_object('submitted',submission_count,'players',player_count,'round_resolved',submission_count>=player_count,'completed',completed,'current_round',next_round);
end; $$;
revoke all on function public.phase22_submit_decision(uuid,integer,text) from public;
grant execute on function public.phase22_submit_decision(uuid,integer,text) to authenticated;
