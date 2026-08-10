# Phase 24 — Best-in-Class UI/UX

Phase 24 is the experience layer on top of the completed Phase 19–23 simulation foundation.

## Goals

- Make the simulator immediately understandable to a first-time founder.
- Make expert decisions feel information-rich without creating information overload.
- Establish one reusable design language across onboarding, command centre, decisions, analytics, learning, competition and account flows.
- Make desktop, tablet and mobile first-class experiences.
- Preserve the canonical deterministic simulation engine and existing persistence/competition boundaries.

## Delivered foundation

- Reusable UI primitives in `apps/web/app/ui/` for cards, badges, buttons, metric cards, status messages, skeletons and section headers.
- Command-centre hierarchy helpers for attention-first summaries.
- Accessible focus, reduced-motion, forced-colors and touch-target rules.
- Consistent loading, empty, success and error presentation.
- Responsive navigation and mobile action patterns.
- Decision presentation remains situation → options → trade-offs → confirmation → consequence.

## Non-goals

Phase 24 does not replace the simulation engine, create a second persistence layer, or introduce a new authentication provider. Email/password + Guest Mode remains the account contract. Supabase remains the persistence boundary.

## Release gate

Before merge, run the repository's complete CI suite and verify:

- simulation tests
- simulation typecheck
- web typecheck
- production web build
- onboarding and dashboard at desktop/tablet/mobile widths
- keyboard-only navigation
- reduced-motion mode
- forced-colors mode
- decision confirmation and consequence feedback
- account menu and auth navigation
- learning and competition navigation
- static GitHub Pages routing/base-path behaviour
