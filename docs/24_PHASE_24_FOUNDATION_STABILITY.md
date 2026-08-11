# Phase 24 — Foundation & Stability

## Objective

Make the existing EnterpriseVerse foundation safe to extend into the 1.0 prototype without masking failures or weakening security controls.

## Scope

- Supabase configuration and production redirect validation
- Authentication redirect handling
- Simulation test/typecheck gates
- Web typecheck/build gates
- Python API syntax validation
- CI quality gate for pull requests and phase branches
- Production deployment environment validation
- Regression protection for future phases

## Production environment contract

The GitHub Pages production build requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

The production validation script rejects missing values, malformed URLs, localhost site URLs, and values that appear to be privileged Supabase credentials.

## Authentication contract

Production auth redirects use `NEXT_PUBLIC_SITE_URL` when configured, with a browser-origin fallback for local development. This prevents email verification and password recovery redirects from accidentally using a development origin in production builds.

The Supabase service-role/secret key must never be assigned to a `NEXT_PUBLIC_*` variable.

## CI quality gate

Every pull request targeting `main`, every `main` push, and every `phase-*` push runs:

1. Simulation tests
2. Simulation typecheck
3. Web typecheck
4. Python API compile check
5. Production web build

The GitHub Pages workflow additionally validates production Supabase/site environment variables before building the deployable artifact.

## Acceptance criteria

### Critical

- No known authentication redirect to localhost in a production build.
- No production build with missing Supabase configuration can pass the deployment validation step.
- No privileged Supabase key is accepted as the public browser key by the deployment validation step.
- Existing simulation tests and typechecks remain enforced.
- Web typecheck and production build remain enforced.
- Python API source remains syntactically valid.

### Verification still required outside repository static checks

The following require a real configured environment/browser and cannot be truthfully marked verified from repository inspection alone:

- Real Supabase signup and email verification click-through
- Real login/logout/session refresh
- Cross-user RLS authorization tests
- Real GitHub Pages deployment smoke test
- Mobile/desktop browser interaction testing

## Known infrastructure limitation

The repository currently has no committed `pnpm-lock.yaml`. CI therefore uses `pnpm install --no-frozen-lockfile`. A future hardening pass should commit a lockfile and switch CI to frozen installs after confirming the generated lockfile is correct.
