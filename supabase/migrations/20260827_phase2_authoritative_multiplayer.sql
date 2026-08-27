-- EnterpriseVerse Phase 2 — authoritative multiplayer hardening
-- Canonical mutation path: authenticated RPC -> authorization -> validation -> atomic state transition.
-- Browser clients never receive direct mutation privileges for competition state.

create table if not exists public.competition_request_keys (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.competition_rooms(id) on delete cascade,
  round integer not null check (round >= 1),
  response jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists competition_request_keys_room_user_idx
  on public.competition_request_keys(room_id, user_id, round);

alter table public.competition_rooms
  add column if not exists state_version bigint not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'competition_rooms_state_version_positive'
      and conrelid = 'public.competition_rooms'::regclass
  ) then
    alter table public.competition_rooms
      add constraint competition_rooms_state_version_positive
      check (state_version >= 1) not valid;
  end if;
end;
$$;

create table if not exists public.competition_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.competition_rooms(id) on delete cascade,
  round integer not null check (round >= 1),
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 80),
  event_version bigint not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists competition_events_room_id_idx
  on public.competition_events(room_id, id);
create index if not exists competition_events_room_round_idx
  on public.competition_events(room_id, round, id);

alter table public.competition_request_keys enable row level security;
alter table public.competition_events enable row level security;

revoke all on public.competition_request_keys, public.competition_events from anon, authenticated;

-- Competition tables are read-only from the browser. All writes go through RPCs.
revoke insert, update, delete on public.competition_rooms from authenticated;
revoke insert, update, delete on public.competition_players from authenticated;
revoke insert, update, delete on public.competition_submissions from authenticated;
revoke insert, update, delete on public.competition_request_keys from authenticated;
revoke insert, update, delete on public.competition_events from authenticated;
revoke select on public.competition_request_keys, public.competition_events from authenticated;

-- Only public quick-match lobbies and rooms the caller belongs to are directly readable.
drop policy if exists competition_rooms_select_authenticated on public.competition_rooms;
create policy competition_rooms_select_authenticated
on public.competition_rooms
for select to authenticated
using (
  (competition_type = 'quick_match' and status = 'lobby')
  or host_id = (select auth.uid())
  or exists (
    select 1 from public.competition_players cp
    where cp.room_id = competition_rooms.id
      and cp.user_id = (select auth.uid())
  )
);

drop policy if exists competition_players_select_authenticated on public.competition_players;
create policy competition_players_select_authenticated
on public.competition_players
for select to authenticated
using (public.is_competition_room_member(room_id));

drop policy if exists competition_submissions_select_authenticated on public.competition_submissions;
create policy competition_submissions_select_authenticated
on public.competition_submissions
for select to authenticated
using (user_id = (select auth.uid()));

-- Explicit locking prevents lifecycle races between ready/start/join operations.
create or replace function public.set_competition_ready(
  p_room_id uuid,
  p_ready boolean
)
returns public.competition_players
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  room public.competition_rooms%rowtype;
  player public.competition_players%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into room from public.competition_rooms where id = p_room_id for update;
  if not found then raise exception 'Competition room not found'; end if;
  if room.status <> 'lobby' then raise exception 'Lobby is closed'; end if;

  update public.competition_players
     set ready = coalesce(p_ready, false), connected = true
   where room_id = room.id and user_id = actor
   returning * into player;
  if not found then raise exception 'You are not in this competition room'; end if;

  update public.competition_rooms
     set state_version = state_version + 1, updated_at = now()
   where id = room.id;

  return player;
end;
$$;
revoke all on function public.set_competition_ready(uuid, boolean) from public, anon;
grant execute on function public.set_competition_ready(uuid, boolean) to authenticated;

create or replace function public.start_competition_room(
  p_room_id uuid
)
returns public.competition_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  room public.competition_rooms%rowtype;
  player_count integer;
  unready_count integer;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into room
    from public.competition_rooms
   where id = p_room_id and host_id = actor
   for update;
  if not found then raise exception 'You do not own this competition room'; end if;
  if room.status <> 'lobby' then raise exception 'This competition is not in the lobby'; end if;

  select count(*), count(*) filter (where not ready)
    into player_count, unready_count
    from public.competition_players
   where room_id = room.id;

  if player_count < 2 then raise exception 'At least two players are required'; end if;
  if unready_count > 0 then raise exception 'Every player must be ready'; end if;

  update public.competition_rooms
     set status = 'active', state_version = state_version + 1, updated_at = now()
   where id = room.id
   returning * into room;

  insert into public.competition_events(room_id, round, actor_id, event_type, event_version, payload)
  values (room.id, room.current_round, actor, 'competition_started', room.state_version, '{}'::jsonb);

  return room;
end;
$$;
revoke all on function public.start_competition_room(uuid) from public, anon;
grant execute on function public.start_competition_room(uuid) to authenticated;

create or replace function public.join_competition_room(
  p_room_id uuid,
  p_display_name text
)
returns public.competition_players
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  room public.competition_rooms%rowtype;
  player public.competition_players%rowtype;
  normalized_name text := trim(coalesce(p_display_name, ''));
  player_count integer;
  was_member boolean;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_room_id is null then raise exception 'Room ID is required'; end if;
  if normalized_name = '' then raise exception 'Display name is required'; end if;
  if char_length(normalized_name) > 80 then raise exception 'Display name is too long'; end if;

  select * into room from public.competition_rooms where id = p_room_id for update;
  if not found then raise exception 'Competition room not found'; end if;
  if room.status <> 'lobby' then raise exception 'This competition has already started'; end if;

  select exists(select 1 from public.competition_players where room_id = room.id and user_id = actor)
    into was_member;
  select count(*) into player_count from public.competition_players where room_id = room.id;
  if not was_member and player_count >= room.max_players then raise exception 'This room is full'; end if;

  insert into public.competition_players(room_id, user_id, display_name, ready, connected)
  values(room.id, actor, normalized_name, false, true)
  on conflict(room_id, user_id) do update
    set display_name = excluded.display_name,
        connected = true
  returning * into player;

  if not was_member then
    update public.competition_rooms set state_version = state_version + 1, updated_at = now() where id = room.id;
    insert into public.competition_events(room_id, round, actor_id, event_type, event_version, payload)
    select id, current_round, actor, 'player_joined', state_version,
           jsonb_build_object('user_id', actor)
      from public.competition_rooms where id = room.id;
  end if;

  return player;
end;
$$;
revoke all on function public.join_competition_room(uuid, text) from public, anon;
grant execute on function public.join_competition_room(uuid, text) to authenticated;

create or replace function public.join_competition_room_by_code(
  p_code text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  normalized_code text := upper(trim(coalesce(p_code, '')));
  player public.competition_players%rowtype;
  room public.competition_rooms%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if normalized_code !~ '^[A-Z0-9]{6}$' then raise exception 'Room code is invalid'; end if;

  select * into room from public.competition_rooms where code = normalized_code;
  if not found then raise exception 'Competition room not found'; end if;

  player := public.join_competition_room(room.id, p_display_name);
  select * into room from public.competition_rooms where id = room.id;

  return jsonb_build_object('room', to_jsonb(room), 'player', to_jsonb(player));
end;
$$;
revoke all on function public.join_competition_room_by_code(text, text) from public, anon;
grant execute on function public.join_competition_room_by_code(text, text) to authenticated;

create or replace function public.get_competition_room_state(p_room_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  room public.competition_rooms%rowtype;
  players jsonb;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into room from public.competition_rooms where id = p_room_id;
  if not found then raise exception 'Competition room not found'; end if;
  if not (
    room.host_id = actor
    or exists(select 1 from public.competition_players where room_id = room.id and user_id = actor)
  ) then
    raise exception 'You are not authorized to view this competition';
  end if;

  select coalesce(jsonb_agg(to_jsonb(cp) order by cp.joined_at asc), '[]'::jsonb)
    into players
    from public.competition_players cp
   where cp.room_id = room.id;

  return jsonb_build_object('room', to_jsonb(room), 'players', players);
end;
$$;
revoke all on function public.get_competition_room_state(uuid) from public, anon;
grant execute on function public.get_competition_room_state(uuid) to authenticated;

-- Replace the round mutation with a locked, idempotent state transition.
drop function if exists public.phase22_submit_decision(uuid, integer, text);

create or replace function public.phase22_submit_decision(
  p_room_id uuid,
  p_round integer,
  p_decision_id text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  room public.competition_rooms%rowtype;
  existing_response jsonb;
  player_count integer;
  submission_count integer;
  next_round integer;
  resolved boolean := false;
  completed boolean := false;
  final_results jsonb := '[]'::jsonb;
  response jsonb;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_request_id is null then raise exception 'Request ID is required'; end if;
  if p_round < 1 then raise exception 'Invalid round'; end if;
  if char_length(trim(coalesce(p_decision_id, ''))) < 1 or char_length(trim(p_decision_id)) > 120 then raise exception 'Invalid decision'; end if;

  select response into existing_response
    from public.competition_request_keys
   where request_id = p_request_id and user_id = actor;
  if found then return existing_response; end if;

  if exists(select 1 from public.competition_request_keys where request_id = p_request_id) then
    raise exception 'Request ID has already been used by another player';
  end if;

  select * into room from public.competition_rooms where id = p_room_id for update;
  if not found then raise exception 'Competition room not found'; end if;
  if room.status <> 'active' then raise exception 'Competition is not active'; end if;
  if room.current_round <> p_round then raise exception 'This round is no longer active'; end if;
  if not exists(select 1 from public.competition_players where room_id = room.id and user_id = actor) then raise exception 'Player is not in this room'; end if;

  insert into public.competition_submissions(room_id, user_id, round, decision_id)
  values(room.id, actor, p_round, trim(p_decision_id))
  on conflict(room_id, user_id, round) do nothing;

  select count(*) into player_count from public.competition_players where room_id = room.id;
  select count(*) into submission_count from public.competition_submissions where room_id = room.id and round = p_round;

  next_round := room.current_round;
  resolved := submission_count >= player_count;

  if resolved then
    if room.current_round >= room.duration_rounds then
      update public.competition_rooms
         set status = 'completed', state_version = state_version + 1, updated_at = now()
       where id = room.id
       returning * into room;
      completed := true;
      final_results := public.phase22_finalize_completed_room(p_room_id)->'results';
    else
      next_round := room.current_round + 1;
      update public.competition_rooms
         set current_round = next_round, state_version = state_version + 1, updated_at = now()
       where id = room.id
       returning * into room;
    end if;

    insert into public.competition_events(room_id, round, actor_id, event_type, event_version, payload)
    values(room.id, p_round, actor,
           case when completed then 'competition_completed' else 'round_resolved' end,
           room.state_version,
           jsonb_build_object('submission_count', submission_count, 'player_count', player_count));
  else
    update public.competition_rooms
       set state_version = state_version + 1, updated_at = now()
     where id = room.id
     returning * into room;
  end if;

  response := jsonb_build_object(
    'submitted', submission_count,
    'players', player_count,
    'round_resolved', resolved,
    'completed', completed,
    'current_round', next_round,
    'results', final_results,
    'state_version', room.state_version
  );

  insert into public.competition_request_keys(request_id, user_id, room_id, round, response)
  values(p_request_id, actor, room.id, p_round, response);

  return response;
end;
$$;
revoke all on function public.phase22_submit_decision(uuid, integer, text, uuid) from public, anon;
grant execute on function public.phase22_submit_decision(uuid, integer, text, uuid) to authenticated;

-- The old score-writing RPC is deliberately unreachable from browser roles.
revoke all on function public.phase22_score(uuid, uuid, text, numeric, jsonb) from public, anon, authenticated;
revoke all on function public.phase22_finalize_completed_room(uuid) from public, anon;
grant execute on function public.phase22_finalize_completed_room(uuid) to authenticated;

-- Leaderboard results are returned only through the secured RPC.
revoke select on public.leaderboard_scores from authenticated;
revoke all on function public.get_leaderboard(text, integer) from public, anon;
grant execute on function public.get_leaderboard(text, integer) to authenticated;
