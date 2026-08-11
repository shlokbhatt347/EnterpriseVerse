-- Phase 22 patch: make round progression atomic and server-validated.
-- Kept as a separate migration version so Supabase migration history remains unique.

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
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_round < 1 or char_length(p_decision_id) < 1 or char_length(p_decision_id) > 120 then raise exception 'Invalid decision'; end if;

  select * into current_room from public.competition_rooms where id = p_room_id for update;
  if not found then raise exception 'Competition room not found'; end if;
  if current_room.status <> 'active' then raise exception 'Competition is not active'; end if;
  if current_room.current_round <> p_round then raise exception 'This round is no longer active'; end if;
  if not exists (select 1 from public.competition_players where room_id = p_room_id and user_id = auth.uid()) then raise exception 'Player is not in this room'; end if;

  insert into public.competition_submissions(room_id, user_id, round, decision_id)
  values (p_room_id, auth.uid(), p_round, p_decision_id)
  on conflict (room_id, user_id, round) do nothing;

  if not exists (select 1 from public.competition_submissions where room_id = p_room_id and user_id = auth.uid() and round = p_round) then
    raise exception 'Decision was not recorded';
  end if;

  select count(*) into player_count from public.competition_players where room_id = p_room_id;
  select count(*) into submission_count from public.competition_submissions where room_id = p_room_id and round = p_round;

  next_round := current_room.current_round;
  if submission_count >= player_count then
    if current_room.current_round >= current_room.duration_rounds then
      update public.competition_rooms set status = 'completed', current_round = current_room.current_round where id = p_room_id;
      completed := true;
    else
      next_round := current_room.current_round + 1;
      update public.competition_rooms set current_round = next_round where id = p_room_id;
    end if;
  end if;

  return jsonb_build_object('submitted', submission_count, 'players', player_count, 'round_resolved', submission_count >= player_count, 'completed', completed, 'current_round', next_round);
end;
$$;

revoke all on function public.phase22_submit_decision(uuid, integer, text) from public;
grant execute on function public.phase22_submit_decision(uuid, integer, text) to authenticated;
