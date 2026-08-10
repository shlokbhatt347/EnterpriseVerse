-- Phase 22 patch: make leaderboard profile embedding explicit for PostgREST.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leaderboard_scores_profile_fk') then
    alter table public.leaderboard_scores
      add constraint leaderboard_scores_profile_fk
      foreign key (user_id) references public.profiles(user_id) on delete cascade;
  end if;
end $$;
