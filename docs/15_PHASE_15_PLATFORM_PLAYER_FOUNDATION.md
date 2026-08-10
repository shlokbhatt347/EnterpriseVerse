# Phase 15 — Platform + Player Foundation

## Scope

Phase 15 establishes the account and persistence boundary required for the next simulation layers without replacing the working Prototype 1 simulation.

### Delivered in this phase

- Guest identity with a stable local founder identity.
- Google sign-in integration point using Firebase Authentication.
- Graceful guest fallback when Firebase configuration is absent or temporarily unavailable.
- Account menu with responsive mobile behavior and accessible controls.
- Firebase Firestore persistence adapter for authenticated business saves.
- Local-first persistence fallback for offline/reconnect recovery.
- Save/load/delete adapter API designed to keep business ownership scoped to the authenticated user.
- Environment template for Firebase browser configuration.
- Layout-level account provider so future simulation surfaces can use the same identity boundary.

## Security model

The browser never decides whether an authenticated user owns another user's cloud data. Firestore rules must enforce:

`users/{uid}/businesses/{businessId}` → only `request.auth.uid == uid`.

Guest progress is local-device progress until the player signs in. The application keeps the local save available so a failed network request does not destroy the active run.

## Google setup

1. Create a Firebase project and Web App.
2. Enable Google provider in Firebase Authentication.
3. Enable Anonymous authentication if anonymous Firebase identity is desired later; the current UI remains usable with the local guest identity.
4. Enable Firestore.
5. Add the six `NEXT_PUBLIC_FIREBASE_*` values from `.env.example` to the web deployment.
6. Configure Firestore rules so users can only access their own `users/{uid}/businesses/*` documents.
7. Add the production domain to Firebase Authentication's authorized domains.

## Important deployment note

EnterpriseVerse is currently configured for a static GitHub Pages web deployment. Firebase configuration can be consumed by a static browser client, but cloud persistence is only active after Firebase is configured and its rules are deployed. Until then, guest/local persistence remains the safe working path.

## Release gate

Phase 15 is considered structurally complete when:

- guest launch remains functional with no Firebase configuration;
- account UI never blocks the simulator;
- Google sign-in works after Firebase configuration;
- authenticated saves are scoped to the authenticated user;
- local fallback survives transient cloud failures;
- existing simulation behavior remains unchanged;
- TypeScript/build/simulation checks remain green.

## Next phase

Phase 16 can build the deeper business economy on top of this identity/persistence boundary without changing the player/account model again.
