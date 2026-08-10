-- EnterpriseVerse Phase 21
-- Run this migration in the connected Supabase project's SQL editor/migrations.
-- Authentication is email/password only; no Google OAuth is required.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Founder' check (char_length(display_name) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  save_key text not null check (char_length(save_key) between 1 and 160),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, save_key)
);

create table if not exists public.simulation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null default 'My Enterprise',
  seed bigint,
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  current_day integer not null default 0 check (current_day >= 0),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulation_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.simulation_runs(id) on delete cascade,
  day integer not null check (day >= 0),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, day)
);

create table if not exists public.learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_key text not null,
  progress numeric not null default 0 check (progress between 0 and 100),
  mastery text not null default 'introduced' check (mastery in ('introduced','developing','strong','mastered')),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_key)
);

create table if not exists public.achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, achievement_key)
);

create table if not exists public.replay_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid references public.simulation_runs(id) on delete set null,
  seed bigint,
  title text not null default 'Simulation replay',
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists simulation_runs_user_updated_idx on public.simulation_runs(user_id, updated_at desc);
create index if not exists simulation_snapshots_run_day_idx on public.simulation_snapshots(run_id, day desc);
create index if not exists replay_history_user_created_idx on public.replay_history(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Founder'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists business_saves_set_updated_at on public.business_saves;
create trigger business_saves_set_updated_at before update on public.business_saves for each row execute procedure public.set_updated_at();
drop trigger if exists simulation_runs_set_updated_at on public.simulation_runs;
create trigger simulation_runs_set_updated_at before update on public.simulation_runs for each row execute procedure public.set_updated_at();
drop trigger if exists learning_progress_set_updated_at on public.learning_progress;
create trigger learning_progress_set_updated_at before update on public.learning_progress for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.business_saves enable row level security;
alter table public.simulation_runs enable row level security;
alter table public.simulation_snapshots enable row level security;
alter table public.learning_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.replay_history enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = user_id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists business_saves_all_own on public.business_saves;
create policy business_saves_all_own on public.business_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists simulation_runs_all_own on public.simulation_runs;
create policy simulation_runs_all_own on public.simulation_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists simulation_snapshots_all_own on public.simulation_snapshots;
create policy simulation_snapshots_all_own on public.simulation_snapshots for all using (
  exists (select 1 from public.simulation_runs r where r.id = simulation_snapshots.run_id and r.user_id = auth.uid())
) with check (
  exists (select 1 from public.simulation_runs r where r.id = simulation_snapshots.run_id and r.user_id = auth.uid())
);

drop policy if exists learning_progress_all_own on public.learning_progress;
create policy learning_progress_all_own on public.learning_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists achievements_all_own on public.achievements;
create policy achievements_all_own on public.achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists replay_history_all_own on public.replay_history;
create policy replay_history_all_own on public.replay_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keep the browser-facing API limited to the intended tables.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.business_saves to authenticated;
grant select, insert, update, delete on public.simulation_runs to authenticated;
grant select, insert, update, delete on public.simulation_snapshots to authenticated;
grant select, insert, update, delete on public.learning_progress to authenticated;
grant select, insert, update, delete on public.achievements to authenticated;
grant select, insert, update, delete on public.replay_history to authenticated;
