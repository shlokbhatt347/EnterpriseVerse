-- EnterpriseVerse Phase 22 — Multiplayer & Competition
-- Apply after Phase 21. Idempotent migration.

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

create or replace function public.phase22_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists friendships_updated_at on public.friendships;
create trigger friendships_updated_at before update on public.friendships for each row execute procedure public.phase22_updated_at();
drop trigger if exists competition_rooms_updated_at on public.competition_rooms;
create trigger competition_rooms_updated_at before update on public.competition_rooms for each row execute procedure public.phase22_updated_at();

alter table public.friendships enable row level security;
alter table public.competition_rooms enable row level security;
alter table public.competition_players enable row level security;
alter table public.competition_submissions enable row level security;
alter table public.leaderboard_scores enable row level security;

-- Friends: only participants can see or mutate their relationship.
drop policy if exists friendships_select_participant on public.friendships;
create policy friendships_select_participant on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists friendships_insert_requester on public.friendships;
create policy friendships_insert_requester on public.friendships for insert with check (auth.uid() = requester_id);
drop policy if exists friendships_update_participant on public.friendships;
create policy friendships_update_participant on public.friendships for update using (auth.uid() = requester_id or auth.uid() = addressee_id) with check (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists friendships_delete_participant on public.friendships;
create policy friendships_delete_participant on public.friendships for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Rooms: authenticated users can discover lobby rooms and inspect rooms they joined.
drop policy if exists competition_rooms_select_authenticated on public.competition_rooms;
create policy competition_rooms_select_authenticated on public.competition_rooms for select to authenticated using (true);
drop policy if exists competition_rooms_insert_host on public.competition_rooms;
create policy competition_rooms_insert_host on public.competition_rooms for insert to authenticated with check (auth.uid() = host_id);
drop policy if exists competition_rooms_update_host on public.competition_rooms;
create policy competition_rooms_update_host on public.competition_rooms for update to authenticated using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- Player rows: users can insert/update only their own membership; room membership is readable to authenticated players.
drop policy if exists competition_players_select_authenticated on public.competition_players;
create policy competition_players_select_authenticated on public.competition_players for select to authenticated using (true);
drop policy if exists competition_players_insert_self on public.competition_players;
create policy competition_players_insert_self on public.competition_players for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists competition_players_update_self on public.competition_players;
create policy competition_players_update_self on public.competition_players for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists competition_players_delete_self on public.competition_players;
create policy competition_players_delete_self on public.competition_players for delete to authenticated using (auth.uid() = user_id);

-- A player may submit only for themselves and only once for each room/round.
drop policy if exists competition_submissions_select_authenticated on public.competition_submissions;
create policy competition_submissions_select_authenticated on public.competition_submissions for select to authenticated using (true);
drop policy if exists competition_submissions_insert_self on public.competition_submissions;
create policy competition_submissions_insert_self on public.competition_submissions for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.competition_players p where p.room_id = competition_submissions.room_id and p.user_id = auth.uid()));

-- Scores are read-only from the browser. They must be inserted by the controlled scoring function below.
drop policy if exists leaderboard_scores_select_authenticated on public.leaderboard_scores;
create policy leaderboard_scores_select_authenticated on public.leaderboard_scores for select to authenticated using (true);

create or replace function public.phase22_score(
  p_user_id uuid,
  p_room_id uuid,
  p_scope text,
  p_score numeric,
  p_metrics jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'Not authorized'; end if;
  if p_scope not in ('global','friends','weekly','monthly','scenario') then raise exception 'Invalid leaderboard scope'; end if;
  if p_score < 0 or p_score > 100000000 then raise exception 'Invalid score'; end if;
  if p_room_id is not null and not exists (select 1 from public.competition_players where room_id = p_room_id and user_id = auth.uid()) then raise exception 'Player is not in this room'; end if;
  insert into public.leaderboard_scores(user_id, room_id, scope, score, metrics)
  values (p_user_id, p_room_id, p_scope, round(p_score, 2), coalesce(p_metrics, '{}'::jsonb))
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.phase22_score(uuid, uuid, text, numeric, jsonb) from public;
grant execute on function public.phase22_score(uuid, uuid, text, numeric, jsonb) to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, update on public.competition_rooms to authenticated;
grant select, insert, update, delete on public.competition_players to authenticated;
grant select, insert on public.competition_submissions to authenticated;
grant select on public.leaderboard_scores to authenticated;
