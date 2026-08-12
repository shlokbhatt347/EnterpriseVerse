drop index if exists leaderboard_room_user_scope_unique_idx;
create unique index leaderboard_room_user_scope_unique_idx
  on public.leaderboard_scores(room_id, user_id, scope);
