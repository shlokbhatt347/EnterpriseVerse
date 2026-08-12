-- Supabase hosted compatibility fix: avoid relying on gen_random_bytes().
-- The room code remains uppercase, six characters, unique, and collision-checked.

create or replace function public.create_competition_room(
  p_display_name text,
  p_duration_rounds integer default 30
)
returns public.competition_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  room public.competition_rooms%rowtype;
  normalized_name text := trim(coalesce(p_display_name, ''));
  normalized_duration integer := greatest(5, least(coalesce(p_duration_rounds, 30), 90));
  room_code text;
  attempts integer := 0;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if normalized_name = '' then raise exception 'Display name is required'; end if;
  if char_length(normalized_name) > 80 then raise exception 'Display name is too long'; end if;

  loop
    attempts := attempts + 1;
    if attempts > 20 then
      raise exception 'Unable to generate a unique room code';
    end if;

    room_code := upper(substr(md5(random()::text || clock_timestamp()::text || actor::text), 1, 6));
    exit when not exists (
      select 1
      from public.competition_rooms
      where code = room_code
    );
  end loop;

  insert into public.competition_rooms(
    code,
    host_id,
    competition_type,
    status,
    max_players,
    duration_rounds,
    current_round,
    world_seed
  ) values (
    room_code,
    actor,
    'friends_only',
    'lobby',
    4,
    normalized_duration,
    1,
    floor(random() * 2147483647)::integer
  )
  returning * into room;

  insert into public.competition_players(
    room_id,
    user_id,
    display_name,
    ready,
    connected
  ) values (
    room.id,
    actor,
    normalized_name,
    false,
    true
  );

  return room;
end;
$$;

revoke all on function public.create_competition_room(text, integer) from public, anon;
grant execute on function public.create_competition_room(text, integer) to authenticated;
