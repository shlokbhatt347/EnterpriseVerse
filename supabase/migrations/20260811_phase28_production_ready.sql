-- EnterpriseVerse Phase 28 — production-ready persistence and security
-- This migration mirrors the production schema hardening applied during Phase 28.
-- It is intentionally additive/idempotent so it can be replayed safely in a fresh environment.

create extension if not exists pgcrypto;

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
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null check (char_length(event_name) between 1 and 120),
  session_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
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

alter table public.simulation_runs add column if not exists business_id uuid references public.businesses(id) on delete set null;

create index if not exists businesses_user_updated_idx on public.businesses(user_id, updated_at desc);
create index if not exists simulation_runs_business_idx on public.simulation_runs(business_id, updated_at desc);
create index if not exists replay_history_run_idx on public.replay_history(run_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index if not exists analytics_events_user_time_idx on public.analytics_events(user_id, occurred_at desc);
create index if not exists analytics_events_name_time_idx on public.analytics_events(event_name, occurred_at desc);

-- Existing timestamp helper from Phase 21.
drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at before update on public.businesses for each row execute procedure public.set_updated_at();
drop trigger if exists founder_progress_set_updated_at on public.founder_progress;
create trigger founder_progress_set_updated_at before update on public.founder_progress for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.business_saves enable row level security;
alter table public.simulation_runs enable row level security;
alter table public.simulation_snapshots enable row level security;
alter table public.learning_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.replay_history enable row level security;
alter table public.businesses enable row level security;
alter table public.founder_progress enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics_events enable row level security;
alter table public.learning_concepts enable row level security;
alter table public.achievement_catalog enable row level security;

-- Existing private-data policies are deliberately authenticated-only and initplan-safe.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists business_saves_all_own on public.business_saves;
create policy business_saves_all_own on public.business_saves for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists simulation_runs_all_own on public.simulation_runs;
create policy simulation_runs_all_own on public.simulation_runs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists simulation_snapshots_all_own on public.simulation_snapshots;
create policy simulation_snapshots_all_own on public.simulation_snapshots for all to authenticated
using (exists (select 1 from public.simulation_runs r where r.id = simulation_snapshots.run_id and r.user_id = (select auth.uid())))
with check (exists (select 1 from public.simulation_runs r where r.id = simulation_snapshots.run_id and r.user_id = (select auth.uid())));

drop policy if exists learning_progress_all_own on public.learning_progress;
create policy learning_progress_all_own on public.learning_progress for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists achievements_all_own on public.achievements;
create policy achievements_all_own on public.achievements for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists replay_history_all_own on public.replay_history;
create policy replay_history_all_own on public.replay_history for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists businesses_all_own on public.businesses;
create policy businesses_all_own on public.businesses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists founder_progress_all_own on public.founder_progress;
create policy founder_progress_all_own on public.founder_progress for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists notifications_all_own on public.notifications;
create policy notifications_all_own on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own on public.analytics_events for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists analytics_events_select_own on public.analytics_events;
create policy analytics_events_select_own on public.analytics_events for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists learning_concepts_read_authenticated on public.learning_concepts;
create policy learning_concepts_read_authenticated on public.learning_concepts for select to authenticated using (true);
drop policy if exists achievement_catalog_read_authenticated on public.achievement_catalog;
create policy achievement_catalog_read_authenticated on public.achievement_catalog for select to authenticated using (true);

revoke all on public.profiles, public.business_saves, public.simulation_runs, public.simulation_snapshots, public.learning_progress, public.achievements, public.replay_history, public.businesses, public.founder_progress, public.notifications, public.analytics_events, public.learning_concepts, public.achievement_catalog from anon;
grant select, insert, update, delete on public.profiles, public.business_saves, public.simulation_runs, public.simulation_snapshots, public.learning_progress, public.achievements, public.replay_history, public.businesses, public.founder_progress, public.notifications to authenticated;
grant insert, select on public.analytics_events to authenticated;
grant select on public.learning_concepts, public.achievement_catalog to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
