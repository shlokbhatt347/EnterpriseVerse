create or replace function public.send_friend_request(p_addressee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  existing public.friendships%rowtype;
  friendship_id uuid;
  requester_name text;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_addressee_id is null then raise exception 'A friend is required'; end if;
  if actor = p_addressee_id then raise exception 'You cannot add yourself'; end if;

  select * into existing
  from public.friendships
  where (requester_id = actor and addressee_id = p_addressee_id)
     or (requester_id = p_addressee_id and addressee_id = actor)
  for update;

  if found then
    if existing.status = 'accepted' then raise exception 'You are already friends'; end if;
    if existing.status = 'pending' then
      if existing.requester_id = actor then raise exception 'Friend request already pending'; end if;
      raise exception 'This user already sent you a friend request';
    end if;
    if existing.status = 'blocked' then raise exception 'Friend request cannot be sent'; end if;
    update public.friendships
      set requester_id = actor, addressee_id = p_addressee_id, status = 'pending', updated_at = now()
      where id = existing.id
      returning id into friendship_id;
  else
    insert into public.friendships(requester_id, addressee_id, status)
    values (actor, p_addressee_id, 'pending')
    returning id into friendship_id;
  end if;

  select p.display_name into requester_name
  from public.profiles p
  where p.user_id = actor
  limit 1;

  insert into public.notifications(user_id, type, title, body, metadata)
  values (
    p_addressee_id,
    'friend_request',
    coalesce(requester_name, 'A founder') || ' wants to connect',
    'You have a new friend request on EnterpriseVerse.',
    jsonb_build_object(
      'friendship_id', friendship_id,
      'requester_id', actor,
      'requester_name', coalesce(requester_name, 'Founder')
    )
  );

  return friendship_id;
end;
$$;

revoke all on function public.send_friend_request(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
