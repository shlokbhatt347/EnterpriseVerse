# EnterpriseVerse Design System 3.0

## Purpose

The design system is the visual and interaction contract for every Experience 3.0 surface. New screens should compose the shared tokens and primitives instead of introducing page-specific visual rules.

## Visual hierarchy

1. Simulation state
2. Current decision/context
3. Primary action
4. Supporting evidence
5. Secondary metadata
6. Decorative detail

## Surfaces

- `--ev-bg-0`: application canvas
- `--ev-bg-1`: navigation/input canvas
- `--ev-surface-1`: default card
- `--ev-surface-2`: raised/contextual card
- `--ev-surface-3`: interactive control
- `--ev-surface-raised`: highest local elevation

Use borders before shadows. Shadows communicate elevation, not decoration.

## Typography

Use a compact system/Inter-style sans for UI and a monospace face for simulation numbers. Numeric values should use tabular figures where possible. Avoid excessive all-caps; eyebrows are reserved for metadata labels.

## Semantic color

Color communicates state, never category alone:

- brand: primary interaction / focus
- critical: urgent risk
- warning: attention required
- success: favorable/confirmed state
- info: neutral informational signal

Every semantic color state must have a non-color cue such as text, icon, position or pattern.

## Density

EnterpriseVerse is an information-dense simulation. Prefer compact controls and strong grouping while preserving a minimum comfortable touch target of roughly 40px for primary mobile actions.

## Motion

- fast: 120ms — hover/focus feedback
- base: 180ms — state transitions
- slow: 260ms — panels and structural movement

Motion must communicate cause/effect or hierarchy. Respect `prefers-reduced-motion`.

## Component contract

The initial shared primitive set is:

- `EVCard`
- `EVStatus`
- `EVButton`
- `EVInput`
- `EVMetric`
- `EVSection`
- `EVProgress`
- `EVEmptyState`

These primitives intentionally remain low-level. Simulation-specific components should compose them rather than modify their tokens locally.

## Interaction principles

- Every important action has a clear active/hover/focus/disabled state.
- Destructive actions are never differentiated by color alone.
- Focus indicators remain visible against all surfaces.
- Empty states explain what is missing and what to do next.
- Loading states preserve layout to avoid cumulative layout shift.
- Contextual panels should not permanently consume workspace on small screens.

## Responsive contract

Desktop: persistent navigation + workspace + optional inspector.

Tablet: compact navigation + workspace + contextual inspector.

Mobile: navigation becomes an overlay; inspectors become bottom sheets; critical actions remain reachable without horizontal scrolling.

## Performance contract

Prefer CSS tokens and local primitives over runtime-heavy styling. Avoid unnecessary client components. Use animation only where it improves comprehension. Keep the shell independent of simulation data fetching.
