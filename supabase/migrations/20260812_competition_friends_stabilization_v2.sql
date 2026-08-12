-- Competition/Friends stabilization: align the repository schema with the live
-- RPC-only mutation architecture and collapse common network waterfalls.

drop policy if exists competition_players_delete_self on public.competition_players;
drop policy if exists competition_players_insert_self on public.competition_players;
drop policy if exists competition_players_update_self on public.competition_players;
drop policy if exists competition_rooms_insert_host on public.competition_rooms;
drop policy if exists competition_rooms_update_host on public.competition_rooms;
drop policy if exists competition_submissions_insert_self on public.competition_submissions;
drop policy if exists friendships_delete_participant on public.friendships;
drop policy if exists friendships_insert_requester on public.friendships;
drop policy if exists friendships_update_requester_block on public.friendships;

create or replace function public.get_competition_room_state(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  room public.competition_rooms%rowtype;
  players jsonb;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_room_id is null then raise exception 'Room ID is required'; end if;
  select * into room from public.competition_rooms where id = p_room_id;
  if not found then raise exception 'Competition room not found'; end if;
  if room.host_id <> actor and not exists (
    select 1 from public.competition_players where room_id = room.id and user_id = actor
  ) then raise exception 'You are not a participant in this room'; end if;
  select coalesce(jsonb_agg(to_jsonb(p) order by p.joined_at asc), '[]'::jsonb)
    into players
  from public.competition_players p
  where p.room_id = room.id;
  return jsonb_build_object('room', to_jsonb(room), 'players', players);
end;
$$;
revoke all on function public.get_competition_room_state(uuid) from public, anon;
grant execute on function public.get_competition_room_state(uuid) to authenticated;

create or replace function public.join_competition_room_by_code(p_code text, p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  normalized_code text := upper(trim(coalesce(p_code,'')));
  normalized_name text := trim(coalesce(p_display_name,''));
  room public.competition_rooms%rowtype;
  player public.competition_players%rowtype;
  player_count integer;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if normalized_code !~ '^[A-Z0-9]{6}$' then raise exception 'Enter the 6-character room code'; end if;
  if normalized_name = '' then raise exception 'Display name is required'; end if;
  if char_length(normalized_name) > 80 then raise exception 'Display name is too long'; end if;
  select * into room from public.competition_rooms where code = normalized_code for update;
  if not found then raise exception 'Room not found. Check the code and try again.'; end if;
  if room.status <> 'lobby' then raise exception 'This competition has already started'; end if;
  select count(*) into player_count from public.competition_players where room_id = room.id;
  if player_count >= room.max_players and not exists (
    select 1 from public.competition_players where room_id = room.id and user_id = actor
  ) then raise exception 'This room is full'; end if;
  insert into public.competition_players(room_id,user_id,display_name,ready,connected)
  values(room.id,actor,normalized_name,false,true)
  on conflict(room_id,user_id) do update
    set display_name = excluded.display_name,
        connected = true,
        updated_at = now()
  returning * into player;
  return jsonb_build_object('room', to_jsonb(room), 'player', to_jsonb(player));
end;
$$;
revoke all on function public.join_competition_room_by_code(text,text) from public, anon;
grant execute on function public.join_competition_room_by_code(text,text) to authenticated;

create or replace function public.get_friend_inbox()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  friends jsonb;
  notifications jsonb;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select coalesce(jsonb_agg(to_jsonb(f) order by f.updated_at desc), '[]'::jsonb)
    into friends
  from public.friendships f
  where f.requester_id = actor or f.addressee_id = actor;
  select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc), '[]'::jsonb)
    into notifications
  from public.notifications n
  where n.user_id = actor and n.type in ('friend_request','friend_request_response');
  return jsonb_build_object('friends', friends, 'notifications', notifications);
end;
$$;
revoke all on function public.get_friend_inbox() from public, anon;
grant execute on function public.get_friend_inbox() to authenticated;

create or replace function public.phase22_decision_points(p_decision_id text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
begin
  case lower(trim(p_decision_id))
    when 'aggressive_growth' then return 82;
    when 'balanced_growth' then return 76;
    when 'defensive_cash' then return 70;
    else raise exception 'Unsupported competition decision';
  end case;
end;
$$;
revoke all on function public.phase22_decision_points(text) from public, anon, authenticated;
