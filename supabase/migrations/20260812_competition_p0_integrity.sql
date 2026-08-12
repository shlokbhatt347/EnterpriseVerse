-- Phase P0: competition/friends integrity hardening.
-- Browser reads competition state through RLS and performs mutations through RPCs.

-- Remove direct browser mutation privileges inherited from Phase 22.
revoke insert, update, delete on public.friendships from authenticated;
revoke insert, update, delete on public.competition_rooms from authenticated;
revoke insert, update, delete on public.competition_players from authenticated;
revoke insert, update, delete on public.competition_submissions from authenticated;
revoke insert, update, delete on public.leaderboard_scores from authenticated;

-- Direct reads are intentionally limited to data needed by the lobby UI.
grant select on public.friendships to authenticated;
grant select on public.competition_rooms to authenticated;
grant select on public.competition_players to authenticated;
grant select on public.notifications to authenticated;

-- Leaderboards are exposed only through the secured RPC so scope filtering is
-- applied before any leaderboard rows reach the browser.
revoke select on public.leaderboard_scores from authenticated;

drop index if exists leaderboard_room_user_scope_unique_idx;
create unique index leaderboard_room_user_scope_unique_idx
  on public.leaderboard_scores(room_id, user_id, scope)
  where room_id is not null;

-- No browser caller should be able to choose an arbitrary score.
revoke execute on function public.phase22_score(uuid, uuid, text, numeric, jsonb) from authenticated;

-- Deterministic competition score used by the current Phase 22 decision model.
-- This is deliberately server-side and derived only from persisted submissions.
create or replace function public.phase22_decision_points(p_decision_id text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case lower(trim(p_decision_id))
    when 'aggressive_growth' then 82
    when 'balanced_growth' then 76
    when 'defensive_cash' then 70
    else 55
  end;
$$;

revoke all on function public.phase22_decision_points(text) from public, anon, authenticated;

-- When the final round resolves, score every participant in one transaction.
-- The score is reproducible from the persisted decisions and cannot be forged
-- by a client-provided numeric value.
create or replace function public.phase22_finalize_completed_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  room public.competition_rooms%rowtype;
  player record;
  score_value numeric;
  rounds integer;
  winners jsonb := '[]'::jsonb;
begin
  if actor is null then raise exception 'Authentication required'; end if;

  select * into room
  from public.competition_rooms
  where id = p_room_id
  for update;

  if not found then raise exception 'Competition room not found'; end if;
  if not exists (
    select 1 from public.competition_players
    where room_id = room.id and user_id = actor
  ) then
    raise exception 'Player is not in this room';
  end if;
  if room.status <> 'completed' then
    raise exception 'Competition is not completed';
  end if;

  for player in
    select cp.user_id, count(cs.id)::integer as submission_count
    from public.competition_players cp
    left join public.competition_submissions cs
      on cs.room_id = cp.room_id and cs.user_id = cp.user_id
    where cp.room_id = room.id
    group by cp.user_id
  loop
    select greatest(1, count(*))::integer into rounds
    from public.competition_submissions
    where room_id = room.id and user_id = player.user_id;

    select round(avg(public.phase22_decision_points(cs.decision_id)), 2)
      into score_value
    from public.competition_submissions cs
    where cs.room_id = room.id and cs.user_id = player.user_id;

    score_value := coalesce(score_value, 0);

    insert into public.leaderboard_scores(
      user_id, room_id, scope, score, metrics
    ) values (
      player.user_id,
      room.id,
      'global',
      score_value,
      jsonb_build_object(
        'competition_room_id', room.id,
        'rounds_submitted', rounds,
        'decision_model', 'phase22_deterministic'
      )
    )
    on conflict (room_id, user_id, scope) do update
      set score = excluded.score,
          metrics = excluded.metrics,
          achieved_at = now();

    insert into public.leaderboard_scores(
      user_id, room_id, scope, score, metrics
    ) values (
      player.user_id,
      room.id,
      'friends',
      score_value,
      jsonb_build_object(
        'competition_room_id', room.id,
        'rounds_submitted', rounds,
        'decision_model', 'phase22_deterministic'
      )
    )
    on conflict (room_id, user_id, scope) do update
      set score = excluded.score,
          metrics = excluded.metrics,
          achieved_at = now();
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object('user_id', x.user_id, 'score', x.score) order by x.score desc), '[]'::jsonb)
    into winners
  from public.leaderboard_scores x
  where x.room_id = room.id and x.scope = 'global';

  return jsonb_build_object(
    'room_id', room.id,
    'completed', true,
    'results', winners
  );
end;
$$;

revoke all on function public.phase22_finalize_completed_room(uuid) from public, anon;
grant execute on function public.phase22_finalize_completed_room(uuid) to authenticated;

-- Make finalization automatic at the end of the final submitted round.
create or replace function public.phase22_submit_decision(
  p_room_id uuid,
  p_round integer,
  p_decision_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_room public.competition_rooms%rowtype;
  player_count integer;
  submission_count integer;
  next_round integer;
  completed boolean := false;
  final_results jsonb := '[]'::jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if p_round < 1 or char_length(trim(p_decision_id)) < 1 or char_length(p_decision_id) > 120 then raise exception 'Invalid decision'; end if;

  select * into current_room
  from public.competition_rooms
  where id = p_room_id
  for update;

  if not found then raise exception 'Competition room not found'; end if;
  if current_room.status <> 'active' then raise exception 'Competition is not active'; end if;
  if current_room.current_round <> p_round then raise exception 'This round is no longer active'; end if;
  if not exists (
    select 1 from public.competition_players
    where room_id = p_room_id and user_id = (select auth.uid())
  ) then raise exception 'Player is not in this room'; end if;

  insert into public.competition_submissions(room_id, user_id, round, decision_id)
  values (p_room_id, (select auth.uid()), p_round, trim(p_decision_id))
  on conflict (room_id, user_id, round) do nothing;

  select count(*) into player_count
  from public.competition_players
  where room_id = p_room_id;

  select count(*) into submission_count
  from public.competition_submissions
  where room_id = p_room_id and round = p_round;

  next_round := current_room.current_round;

  if submission_count >= player_count then
    if current_room.current_round >= current_room.duration_rounds then
      update public.competition_rooms
      set status = 'completed', current_round = current_room.current_round
      where id = p_room_id;
      completed := true;

      final_results := public.phase22_finalize_completed_room(p_room_id)->'results';
    else
      next_round := current_room.current_round + 1;
      update public.competition_rooms
      set current_round = next_round
      where id = p_room_id;
    end if;
  end if;

  return jsonb_build_object(
    'submitted', submission_count,
    'players', player_count,
    'round_resolved', submission_count >= player_count,
    'completed', completed,
    'current_round', next_round,
    'results', final_results
  );
end;
$$;

revoke all on function public.phase22_submit_decision(uuid, integer, text) from public, anon;
grant execute on function public.phase22_submit_decision(uuid, integer, text) to authenticated;

-- Keep the existing atomic room lifecycle RPCs as the only mutation path.
revoke all on function public.create_competition_room(text, integer) from public, anon;
grant execute on function public.create_competition_room(text, integer) to authenticated;
revoke all on function public.join_competition_room(uuid, text) from public, anon;
grant execute on function public.join_competition_room(uuid, text) to authenticated;
revoke all on function public.set_competition_ready(uuid, boolean) from public, anon;
grant execute on function public.set_competition_ready(uuid, boolean) to authenticated;
revoke all on function public.start_competition_room(uuid) from public, anon;
grant execute on function public.start_competition_room(uuid) to authenticated;

-- Friend requests are also RPC-only for state mutation.
revoke all on function public.send_friend_request(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
revoke all on function public.respond_friend_request(uuid, text) from public, anon;
grant execute on function public.respond_friend_request(uuid, text) to authenticated;

-- Leaderboard results are returned only by get_leaderboard().
revoke select on public.leaderboard_scores from authenticated;
revoke all on function public.get_leaderboard(text, integer) from public, anon;
grant execute on function public.get_leaderboard(text, integer) to authenticated;
