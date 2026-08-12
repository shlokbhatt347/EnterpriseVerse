-- Phase 7: seasons and authoritative endgame metadata.
create table if not exists public.phase7_seasons (
  id uuid primary key default gen_random_uuid(),
  season_key text not null unique,
  name text not null,
  theme text not null,
  status text not null default 'active' check (status in ('upcoming','active','completed')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists phase7_seasons_status_idx on public.phase7_seasons(status, starts_at desc);

insert into public.phase7_seasons (season_key, name, theme, status)
values ('season-1-enterprise-ascension', 'Season 1 — Enterprise Ascension', 'Build the strongest enterprise, career and competitive legacy.', 'active')
on conflict (season_key) do nothing;

alter table public.phase7_seasons enable row level security;
drop policy if exists phase7_seasons_select_authenticated on public.phase7_seasons;
create policy phase7_seasons_select_authenticated on public.phase7_seasons
  for select to authenticated using (true);

revoke all on public.phase7_seasons from public, anon;
grant select on public.phase7_seasons to authenticated;

create or replace function public.get_active_phase7_season()
returns table(id uuid, season_key text, name text, theme text, status text, starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.season_key, s.name, s.theme, s.status, s.starts_at, s.ends_at
  from public.phase7_seasons s
  where s.status = 'active'
  order by s.starts_at desc
  limit 1;
$$;

revoke all on function public.get_active_phase7_season() from public, anon;
grant execute on function public.get_active_phase7_season() to authenticated;
