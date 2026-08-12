-- Production multiplayer realtime publication.
-- Keep the database as the authority; realtime only transports committed changes.

alter table public.competition_rooms replica identity full;
alter table public.competition_players replica identity full;
alter table public.competition_submissions replica identity full;
alter table public.friendships replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'competition_rooms'
  ) then
    execute 'alter publication supabase_realtime add table public.competition_rooms';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'competition_players'
  ) then
    execute 'alter publication supabase_realtime add table public.competition_players';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'competition_submissions'
  ) then
    execute 'alter publication supabase_realtime add table public.competition_submissions';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships'
  ) then
    execute 'alter publication supabase_realtime add table public.friendships';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end;
$$;
