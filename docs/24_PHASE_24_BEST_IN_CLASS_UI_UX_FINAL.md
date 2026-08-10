# Phase 24 — Best-in-Class UI/UX

Phase 24 is the experience layer on top of the completed Phase 19–23 simulation foundation.

## Product principles

1. **Attention before detail** — the interface answers what needs attention before exposing deeper analytics.
2. **Decision clarity** — every decision communicates situation → options → trade-offs → confirmation → consequence.
3. **Progressive disclosure** — advanced information is available without forcing beginners to process it.
4. **One visual language** — cards, metrics, buttons, badges, fields, states and navigation use the same tokens and interaction rules.
5. **Mobile is first-class** — touch targets and information hierarchy are designed for small screens, not merely compressed.
6. **Accessible by default** — keyboard focus, semantic controls, reduced motion, forced colors and clear status announcements are preserved.
7. **Simulation stays canonical** — Phase 24 changes presentation only; Phase 19–23 remain the authoritative simulation/competition/learning layers.

## Delivered

- Reusable UI primitives in `apps/web/app/ui/` for cards, badges, buttons, metric cards, status messages, skeletons, empty states, fields and section headers.
- A dedicated Phase 24 responsive experience layer.
- Improved executive dashboard hierarchy and metric presentation.
- Premium decision-card treatment with explicit risk and impact language.
- Keyboard arrow-key movement between decision options.
- Consistent selected/disabled/focus/consequence states.
- Desktop/tablet/mobile decision layouts.
- Reduced-motion and forced-colors support for Phase 24 interactions.
- Light-theme support for the new decision experience.
- Existing authentication remains **email/password + Guest Mode only**.
- Existing Supabase persistence boundary remains unchanged.

## Release gate

Before merge:

- `pnpm test:simulation`
- simulation typecheck
- web typecheck
- production web build
- verify onboarding/dashboard at desktop, tablet and mobile widths
- verify keyboard-only decision navigation
- verify reduced-motion mode
- verify forced-colors mode
- verify light/dark themes
- verify auth/account/learning/competition navigation
- verify GitHub Pages static routing/base-path behaviour
