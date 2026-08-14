-- EnterpriseVerse performance pass
-- Targeted indexes for hot-path workspace and invitation lookups.
-- Existing notification indexes already cover notification hot paths.

create index if not exists business_invitations_business_invitee_status_idx
  on public.business_invitations(business_id, invitee_id, status);

create index if not exists business_invitations_business_status_created_idx
  on public.business_invitations(business_id, status, created_at desc);

create index if not exists business_events_business_type_created_idx
  on public.business_events(business_id, event_type, created_at desc);
