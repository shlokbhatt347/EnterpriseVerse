# EnterpriseVerse Experience Intelligence — Steps 3–8

Steps 3–8 are implemented as one coordinated layer while remaining independently testable.

## Step 3 — Design System

Shared EV tokens and primitives define visual hierarchy, semantic state, density, motion, focus and responsive behavior. Screens should compose these primitives instead of creating local visual systems.

## Step 4 — Attention Engine

Attention signals have explicit priority, reason, unread state and optional expiry/entity/action metadata. `rankAttention()` provides deterministic ordering. The UI distinguishes critical, important, signal and background attention without relying on color alone.

## Step 5 — Context Engine

Context panels bind an entity to a concise summary, key facts and connected entities. Context is intended to answer: "What am I looking at, why does it matter, and what else is connected?"

## Step 6 — Causality Engine

Causal chains model nodes and explanatory edges. The UI presents a readable cause → consequence path and exposes the explanation for each link. Confidence is explicit because simulated causality may be uncertain.

## Step 7 — Decision Engine

Decisions contain a situation and structured options. Options expose cost, risk, time, effects and confidence. Recommendations are deterministic and transparent; the UI allows the learner to compare and explicitly commit an option. The engine does not claim uncertain outcomes are guaranteed.

## Step 8 — Memory Engine

Memory events record turn, title, description, related entities and outcome. `remember()` deduplicates by event id, keeps newest-first order and caps history to prevent unbounded UI state.

## Integrated loop

Simulation event → memory → context → causality → attention → decision → simulation consequence → memory.

The experience intelligence layer must remain UI/data-source agnostic. Simulation adapters should provide domain facts; the layer decides how those facts are structured for comprehension.

## Non-negotiables

- No fake real-time state in production adapters.
- No hidden decision scoring presented as objective truth.
- No color-only semantic communication.
- No irreversible action without an explicit confirmation/commit step.
- No global attention flood: prioritize, group and explain.
- No permanent mobile inspector; contextual surfaces become temporary sheets.
