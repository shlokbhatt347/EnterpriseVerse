# Phase 21 — Accounts, Cloud & Social Foundation

## Implemented

- Email/password authentication through Supabase Auth.
- Guest mode remains available without an account.
- Browser-side access/refresh session handling is used because the web app is deployed as a static Next.js export on GitHub Pages.
- Session refresh is handled before authenticated Supabase requests when the access token is near expiry.
- Email verification is supported by Supabase Auth.
- Password recovery email flow and password reset completion are implemented.
- Account settings support display-name updates.
- Cloud saves are persisted in `business_saves` with user-scoped RLS.
- Simulation run, snapshot, learning, achievement and replay tables are provisioned for the later Phase 22–24 features.
- Guest gameplay remains local-first; authenticated users additionally sync saves to Supabase.
- Obsolete Firebase configuration/authentication was removed from the web account layer.

## Required Supabase configuration

In Supabase Auth settings:

1. Enable **Email** provider.
2. Keep email/password authentication enabled.
3. Configure the production Site URL to the deployed EnterpriseVerse URL.
4. Add the deployed URL and local development URL to the allowed redirect URLs.
5. Keep email confirmation enabled for production accounts.

In the web environment:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The anon key is intended for the browser-facing Supabase API. The database is protected by Row Level Security; no service-role key belongs in the web app.

## Migration

Run:

`supabase/migrations/20260810_phase21_accounts_cloud.sql`

against the connected Supabase project before testing cloud persistence.

## Authentication contract

EnterpriseVerse intentionally uses **email + password only**. There is no Google/Gmail OAuth button in Phase 21.

Guest → account conversion keeps local progress available while the user creates an account. Once the account is verified and signed in, the active local save is reconciled with the authenticated cloud save before background synchronization starts.

## Deployment note

The GitHub Pages build receives the public Supabase URL and anon key through build-time GitHub Actions secrets. These values are safe for the browser-facing Supabase client; database access is enforced by RLS, not by hiding the anon key.
