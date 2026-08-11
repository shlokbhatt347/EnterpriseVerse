# Phase 28 — Production Readiness

Phase 28 is the final production-hardening gate for EnterpriseVerse. It reconciles the Supabase schema, hardens RLS/grants, makes email verification production-safe, and documents the remaining hosted-Supabase configuration that cannot be committed to Git.

## Supabase schema contract

The application contract now includes:

- `profiles`
- `business_saves`
- `businesses`
- `simulation_runs`
- `simulation_snapshots`
- `founder_progress`
- `learning_concepts`
- `learning_progress`
- `achievement_catalog`
- `achievements`
- `notifications`
- `analytics_events`
- `replay_history`
- `friendships`
- `competition_rooms`
- `competition_players`
- `competition_submissions`
- `leaderboard_scores`

All browser-exposed application tables have RLS enabled. Private user data is restricted by `auth.uid()`. Reference catalogs are read-only to authenticated users. Anonymous browser access is revoked.

## Email verification

The signup flow sends Supabase's **Confirm signup** email. The production redirect is now an explicit `/auth/verified` callback rather than relying on a localhost/default URL.

Recommended hosted Supabase confirmation email:

**Subject:** `Welcome to EnterpriseVerse — verify your email`

```html
<h2>Welcome to EnterpriseVerse</h2>
<p>Your founder account is almost ready.</p>
<p>Verify your email address to activate your account and securely save your enterprises in the cloud.</p>
<p><a href="{{ .ConfirmationURL }}">Verify my email</a></p>
<p>If you did not create an EnterpriseVerse account, you can safely ignore this email.</p>
```

Use `{{ .ConfirmationURL }}` rather than hard-coding the Supabase URL. Supabase documents that this variable contains the confirmation URL and that the project's Site URL / redirect allow-list control where users return after verification.

### Hosted Supabase settings that must be configured

These are project-level settings and are intentionally not stored in Git:

1. **Authentication → URL Configuration → Site URL**
   - Set to the deployed EnterpriseVerse root URL.
2. **Authentication → URL Configuration → Redirect URLs**
   - Add the deployed EnterpriseVerse root URL.
   - Add the deployed `/auth/verified` callback URL.
   - Add the local development callback URL only if local auth testing is required.
3. **Authentication → Providers → Email**
   - Email/password enabled.
   - Email confirmation required for production accounts.
4. **Authentication → Email Templates → Confirm signup**
   - Use the production subject/body above, subject to the project's Supabase plan/email-provider limitations.
5. **Authentication → Password security**
   - Use a strong minimum password length.
   - Enable leaked-password protection when the project's plan supports it.

The application already passes `redirect_to` during signup and password recovery, and production builds require `NEXT_PUBLIC_SITE_URL`.

## Production environment

GitHub Pages must provide:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Only the public Supabase URL and publishable/anon client key may be exposed to the browser. Never add a service-role or secret key to `NEXT_PUBLIC_*` variables.

## Validation

After applying the migration, verify:

- All listed tables exist.
- All listed tables have RLS enabled.
- Anonymous roles have no application-table privileges.
- Authenticated users can access only their own private data.
- Competition submissions are readable only by their submitter.
- Competition round/scoring RPCs require an authenticated caller and validate ownership.
- Signup confirmation redirects to `/auth/verified` on the deployed site.
- Password recovery redirects to `/auth/reset` on the deployed site.
- Cloud saves survive refresh and re-login.

## Known hosted-platform configuration boundary

Supabase hosted email templates, Site URL, redirect allow-list, password-security settings, SMTP/provider configuration, and some Auth project settings are managed through the Supabase project configuration rather than repository SQL. They must be verified in the hosted project before declaring the external email flow fully tested.
