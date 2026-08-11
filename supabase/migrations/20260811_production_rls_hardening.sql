-- EnterpriseVerse production hardening
-- Applies stricter role scoping and prevents multiplayer decision leakage.
-- Run after the Phase 21/22 migrations.

-- Phase 21: explicitly scope private application data to authenticated users.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists business_saves_all_own on public.business_saves;
create policy business_saves_all_own on public.business_saves
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists simulation_runs_all_own on public.simulation_runs;
create policy simulation_runs_all_own on public.simulation_runs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists simulation_snapshots_all_own on public.simulation_snapshots;
create policy simulation_snapshots_all_own on public.simulation_snapshots
  for all to authenticated
  using (
    exists (
      select 1
      from public.simulation_runs r
      where r.id = simulation_snapshots.run_id
        and r.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.simulation_runs r
      where r.id = simulation_snapshots.run_id
        and r.user_id = (select auth.uid())
    )
  );

drop policy if exists learning_progress_all_own on public.learning_progress;
create policy learning_progress_all_own on public.learning_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists achievements_all_own on public.achievements;
create policy achievements_all_own on public.achievements
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists replay_history_all_own on public.replay_history;
create policy replay_history_all_own on public.replay_history
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Phase 22: room metadata may be discovered while a room is in the lobby,
-- but active/completed room details are restricted to hosts and participants.
drop policy if exists competition_rooms_select_authenticated on public.competition_rooms;
create policy competition_rooms_select_authenticated on public.competition_rooms
  for select to authenticated
  using (
    status = 'lobby'
    or host_id = (select auth.uid())
    or exists (
      select 1
      from public.competition_players p
      where p.room_id = competition_rooms.id
        and p.user_id = (select auth.uid())
    )
  );

drop policy if exists competition_rooms_insert_host on public.competition_rooms;
create policy competition_rooms_insert_host on public.competition_rooms
  for insert to authenticated
  with check ((select auth.uid()) = host_id);

drop policy if exists competition_rooms_update_host on public.competition_rooms;
create policy competition_rooms_update_host on public.competition_rooms
  for update to authenticated
  using ((select auth.uid()) = host_id)
  with check ((select auth.uid()) = host_id);

drop policy if exists competition_players_select_authenticated on public.competition_players;
create policy competition_players_select_authenticated on public.competition_players
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.competition_players me
      where me.room_id = competition_players.room_id
        and me.user_id = (select auth.uid())
    )
  );

drop policy if exists competition_players_insert_self on public.competition_players;
create policy competition_players_insert_self on public.competition_players
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists competition_players_update_self on public.competition_players;
create policy competition_players_update_self on public.competition_players
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists competition_players_delete_self on public.competition_players;
create policy competition_players_delete_self on public.competition_players
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Decisions are private to the submitting player. The server-side round RPC
-- remains security-definer and can aggregate them without exposing choices.
drop policy if exists competition_submissions_select_authenticated on public.competition_submissions;
create policy competition_submissions_select_own on public.competition_submissions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists competition_submissions_insert_self on public.competition_submissions;
create policy competition_submissions_insert_self on public.competition_submissions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.competition_players p
      where p.room_id = competition_submissions.room_id
        and p.user_id = (select auth.uid())
    )
  );

-- Leaderboards are intentionally readable to signed-in users, but remain
-- write-protected from the browser except through the validated scoring RPC.
drop policy if exists leaderboard_scores_select_authenticated on public.leaderboard_scores;
create policy leaderboard_scores_select_authenticated on public.leaderboard_scores
  for select to authenticated
  using (true);

-- Keep all public application tables out of the anonymous Data API role.
revoke all on public.profiles, public.business_saves, public.simulation_runs,
  public.simulation_snapshots, public.learning_progress, public.achievements,
  public.replay_history, public.friendships, public.competition_rooms,
  public.competition_players, public.competition_submissions,
  public.leaderboard_scores from anon;

-- Restore the intended authenticated grants after the explicit anon revoke.
grant select, insert, update, delete on public.profiles, public.business_saves,
  public.simulation_runs, public.simulation_snapshots, public.learning_progress,
  public.achievements, public.replay_history, public.friendships,
  public.competition_players, public.competition_submissions to authenticated;
grant select, insert, update on public.competition_rooms to authenticated;
grant select on public.leaderboard_scores to authenticated;
