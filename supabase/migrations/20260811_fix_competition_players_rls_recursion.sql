-- Phase 28: fix recursive competition_players SELECT policy.
-- The previous policy queried competition_players from its own RLS policy,
-- causing PostgreSQL to raise: infinite recursion detected in policy for relation
-- "competition_players".

create or replace function public.is_competition_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.competition_players cp
    where cp.room_id = p_room_id
      and cp.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_competition_room_member(uuid) from public;
grant execute on function public.is_competition_room_member(uuid) to authenticated;

drop policy if exists competition_players_select_authenticated on public.competition_players;
create policy competition_players_select_authenticated
on public.competition_players
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_competition_room_member(room_id)
);
