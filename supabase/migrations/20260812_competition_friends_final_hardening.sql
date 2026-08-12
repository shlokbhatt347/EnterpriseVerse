create or replace function public.join_competition_room(p_room_id uuid,p_display_name text)
returns public.competition_players
language plpgsql security definer set search_path=public
as $$
declare actor uuid := auth.uid(); room public.competition_rooms%rowtype; player public.competition_players%rowtype; normalized_name text := trim(coalesce(p_display_name,'')); player_count integer;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_room_id is null then raise exception 'Room ID is required'; end if;
  if normalized_name = '' then raise exception 'Display name is required'; end if;
  if char_length(normalized_name) > 80 then raise exception 'Display name is too long'; end if;
  select * into room from public.competition_rooms where id=p_room_id for update;
  if not found then raise exception 'Competition room not found'; end if;
  if room.status <> 'lobby' then raise exception 'This competition has already started'; end if;
  select count(*) into player_count from public.competition_players where room_id=room.id;
  if player_count >= room.max_players and not exists(select 1 from public.competition_players where room_id=room.id and user_id=actor) then raise exception 'This room is full'; end if;
  insert into public.competition_players(room_id,user_id,display_name,ready,connected)
  values(room.id,actor,normalized_name,false,true)
  on conflict(room_id,user_id) do update set display_name=excluded.display_name,connected=true
  returning * into player;
  return player;
end;
$$;
revoke all on function public.join_competition_room(uuid,text) from public,anon; grant execute on function public.join_competition_room(uuid,text) to authenticated;

create or replace function public.set_competition_ready(p_room_id uuid,p_ready boolean)
returns public.competition_players
language plpgsql security definer set search_path=public
as $$
declare actor uuid:=auth.uid(); player public.competition_players%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  update public.competition_players set ready=p_ready,connected=true where room_id=p_room_id and user_id=actor returning * into player;
  if not found then raise exception 'You are not in this competition room'; end if;
  return player;
end;
$$;
revoke all on function public.set_competition_ready(uuid,boolean) from public,anon; grant execute on function public.set_competition_ready(uuid,boolean) to authenticated;

create or replace function public.start_competition_room(p_room_id uuid)
returns public.competition_rooms
language plpgsql security definer set search_path=public
as $$
declare actor uuid:=auth.uid(); room public.competition_rooms%rowtype; players integer; unready integer;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into room from public.competition_rooms where id=p_room_id and host_id=actor for update;
  if not found then raise exception 'You do not own this competition room'; end if;
  if room.status <> 'lobby' then raise exception 'This competition is not in the lobby'; end if;
  select count(*), count(*) filter (where not ready) into players,unready from public.competition_players where room_id=room.id;
  if players < 2 then raise exception 'At least two players are required'; end if;
  if unready > 0 then raise exception 'Every player must be ready'; end if;
  update public.competition_rooms set status='active',updated_at=now() where id=room.id returning * into room;
  return room;
end;
$$;
revoke all on function public.start_competition_room(uuid) from public,anon; grant execute on function public.start_competition_room(uuid) to authenticated;

create or replace function public.get_leaderboard(p_scope text,p_limit integer default 50)
returns table(user_id uuid,scope text,score numeric,rank integer,metrics jsonb,achieved_at timestamptz,display_name text)
language sql stable security definer set search_path=public
as $$
  with eligible as (
    select ls.user_id, ls.scope, ls.score, ls.metrics, ls.achieved_at
    from public.leaderboard_scores ls
    where ls.scope = p_scope
      and (p_scope <> 'friends' or ls.user_id = (select auth.uid()) or exists (
        select 1 from public.friendships f
        where f.status='accepted' and ((f.requester_id=(select auth.uid()) and f.addressee_id=ls.user_id) or (f.addressee_id=(select auth.uid()) and f.requester_id=ls.user_id))
      ))
  )
  select e.user_id,e.scope,e.score,row_number() over(order by e.score desc,e.achieved_at asc)::integer,e.metrics,e.achieved_at,p.display_name
  from eligible e left join public.profiles p on p.user_id=e.user_id
  order by e.score desc,e.achieved_at asc
  limit greatest(1,least(coalesce(p_limit,50),100));
$$;
revoke all on function public.get_leaderboard(text,integer) from public,anon; grant execute on function public.get_leaderboard(text,integer) to authenticated;
create index if not exists leaderboard_scores_scope_score_idx on public.leaderboard_scores(scope,score desc,achieved_at asc);
create index if not exists leaderboard_scores_user_scope_idx on public.leaderboard_scores(user_id,scope);
create index if not exists friendships_status_requester_addressee_idx on public.friendships(status,requester_id,addressee_id);
