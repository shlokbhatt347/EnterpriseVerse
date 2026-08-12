-- Phase 29 production hardening: friend request state transitions, notifications,
-- non-recursive competition-player RLS, and missing FK indexes.

create index if not exists business_invitations_inviter_idx
  on public.business_invitations(inviter_id, status, created_at desc);
create index if not exists competition_rooms_host_idx
  on public.competition_rooms(host_id, status, updated_at desc);
create index if not exists competition_submissions_user_idx
  on public.competition_submissions(user_id, room_id, round);
create index if not exists leaderboard_scores_room_idx
  on public.leaderboard_scores(room_id, achieved_at desc);

-- Dedicated RPCs provide the only browser path for accept/decline.
drop policy if exists friendships_update_participant on public.friendships;
create policy friendships_update_requester_block
on public.friendships for update to authenticated
using ((select auth.uid()) = requester_id and status <> 'accepted')
with check ((select auth.uid()) = requester_id and status = 'blocked');

create or replace function public.send_friend_request(p_addressee_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare actor uuid := (select auth.uid()); existing public.friendships%rowtype; friendship_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_addressee_id is null then raise exception 'A friend is required'; end if;
  if actor = p_addressee_id then raise exception 'You cannot add yourself'; end if;
  select * into existing from public.friendships where (requester_id=actor and addressee_id=p_addressee_id) or (requester_id=p_addressee_id and addressee_id=actor) for update;
  if found then
    if existing.status='accepted' then raise exception 'You are already friends'; end if;
    if existing.status='pending' then
      if existing.requester_id=actor then raise exception 'Friend request already pending'; end if;
      raise exception 'This user already sent you a friend request';
    end if;
    if existing.status='blocked' then raise exception 'Friend request cannot be sent'; end if;
    update public.friendships set requester_id=actor,addressee_id=p_addressee_id,status='pending',updated_at=now() where id=existing.id returning id into friendship_id;
  else
    insert into public.friendships(requester_id,addressee_id,status) values(actor,p_addressee_id,'pending') returning id into friendship_id;
  end if;
  insert into public.notifications(user_id,type,title,body,metadata) values(p_addressee_id,'friend_request','New friend request','Someone wants to connect with you on EnterpriseVerse.',jsonb_build_object('friendship_id',friendship_id,'requester_id',actor));
  return friendship_id;
end;
$$;
revoke all on function public.send_friend_request(uuid) from public,anon; grant execute on function public.send_friend_request(uuid) to authenticated;

create or replace function public.respond_friend_request(p_friendship_id uuid,p_action text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare actor uuid := (select auth.uid()); friendship public.friendships%rowtype; result_id uuid; notification_title text; notification_body text;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_friendship_id is null then raise exception 'Friend request is required'; end if;
  if p_action not in ('accepted','declined') then raise exception 'Invalid friend request action'; end if;
  select * into friendship from public.friendships where id=p_friendship_id and addressee_id=actor and status='pending' for update;
  if not found then raise exception 'Friend request not found or no longer pending'; end if;
  update public.friendships set status=p_action,updated_at=now() where id=p_friendship_id returning id into result_id;
  notification_title := case when p_action='accepted' then 'Friend request accepted' else 'Friend request declined' end;
  notification_body := case when p_action='accepted' then 'Your friend request was accepted.' else 'Your friend request was declined.' end;
  insert into public.notifications(user_id,type,title,body,metadata) values(friendship.requester_id,'friend_request_response',notification_title,notification_body,jsonb_build_object('friendship_id',result_id,'response',p_action,'actor_id',actor));
  return result_id;
end;
$$;
revoke all on function public.respond_friend_request(uuid,text) from public,anon; grant execute on function public.respond_friend_request(uuid,text) to authenticated;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns uuid language sql security definer set search_path = public
as $$ update public.notifications set read_at=now() where id=p_notification_id and user_id=(select auth.uid()) returning id; $$;
revoke all on function public.mark_notification_read(uuid) from public,anon; grant execute on function public.mark_notification_read(uuid) to authenticated;

revoke update on public.friendships from authenticated;

drop policy if exists competition_players_select_authenticated on public.competition_players;
create policy competition_players_select_authenticated on public.competition_players for select to authenticated using (user_id=(select auth.uid()) or (select public.is_competition_room_member(room_id)));
