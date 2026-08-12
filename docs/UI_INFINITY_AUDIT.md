# EnterpriseVerse UI Infinity Audit

## Baseline

The product now contains the complete Phase 1–7 experience: onboarding, company organization, career/recruitment, living enterprise command center, advanced strategy, AI/education, competition/endgame, notifications and authentication.

The repository already has multiple UI layers (`globals.css`, `ui-overrides.css`, `phase12-experience.css`, `phase24-experience.css`, `phase27-premium.css`, and primitive styles). The primary UX risk is therefore fragmentation rather than absence of styling.

## Infinity UI goals

- One visual language across all routes.
- Executive-grade information hierarchy.
- Immediate perception of status, attention and next action.
- Consistent controls, cards, badges, tables, forms and navigation.
- Desktop command-center density without sacrificing mobile usability.
- Strong loading, empty, success and error states.
- Accessible keyboard focus and reduced-motion behavior.
- No visual optimization that blocks the simulator or network state.
- Preserve existing page behavior and data contracts.

## Route groups

### Entry and identity
- `/`
- `/start`
- `/auth/signin`
- `/auth/signup`
- `/auth/reset`

### Core simulation
- `/play`
- `/enterprise`
- `/company`
- `/world`
- `/strategy`

### Social and career
- `/career`
- notification center / global notification UI

### Multiplayer
- `/competition`
- competition room / participant / result surfaces

### Intelligence and education
- `/learning`
- Phase 6 intelligence surfaces

### Endgame
- `/endgame`

### Global states
- app loading
- auth loading
- cloud-save loading/sync
- empty data
- network failure
- authorization failure
- destructive confirmation
- mobile navigation

## Design system direction

Visual direction: premium enterprise command center rather than generic SaaS or game UI.

Core traits:
- dark graphite foundation
- layered surfaces with restrained translucency
- one electric accent for primary actions
- semantic success/warning/danger colors
- strong display typography with compact analytical metadata
- dense but breathable KPI layouts
- subtle 1px borders and depth rather than heavy shadows
- motion only when it communicates state

## Implementation strategy

The first infinity pass establishes root tokens and shared primitives at the layout level. Existing page-specific styles remain intact but inherit the new tokens and interaction language. This provides a low-risk visual migration path while preserving simulation logic.

Future refinements can then replace page-specific exceptions route by route without another theme collision.
