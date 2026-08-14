# EnterpriseVerse — Experience 3.0 Architecture

## Status

**Step 1 — Experience Architecture: COMPLETE**

This document is the product-level information architecture for the UI/UX transformation. It is deliberately independent of the current route structure so the interface can evolve without repeatedly changing the simulation engine.

## 1. The mental model

EnterpriseVerse is one living business world, not a collection of dashboards.

The player moves through seven mental models:

1. **World** — understand the external environment.
2. **Enterprise** — run the company.
3. **Decide** — make consequential choices.
4. **Intelligence** — observe, explain, forecast and experiment.
5. **Learn** — learn concepts and skills in context.
6. **Compete** — compete against other enterprises and rivals.
7. **Legacy** — understand the company and founder created by the player's decisions.

These seven areas are the only permanent primary navigation concepts. Individual pages, metrics and tools belong underneath them.

## 2. Experience loop

```text
WORLD MOVES
    ↓
PLAYER NOTICES
    ↓
ATTENTION
    ↓
UNDERSTAND / WHY?
    ↓
WHAT-IF / OPTIONS
    ↓
DECISION
    ↓
SIMULATION RESPONSE
    ↓
CONSEQUENCE
    ↓
REFLECTION
    ↓
LEARNING
    ↓
MEMORY
    ↓
COMPANY EVOLVES
    ↺
```

The UI must make this loop visible without turning it into a tutorial overlay.

## 3. Experience modes

Every major screen can operate in three modes:

### Explore

Understand the current state. Priorities: orientation, context, comparison and discovery.

### Decide

Reduce noise and expose trade-offs, options, risks and expected consequences.

### Reflect

Explain what changed, why it changed, what the player learned and what to watch next.

The simulation state remains authoritative. The mode changes presentation and interaction, not the underlying business rules.

## 4. Canonical information architecture

### WORLD

- Markets
- Economy
- Competitors
- Suppliers
- Events

**Principle:** Understand the environment before acting inside it.

### ENTERPRISE

- Company
- Finance
- Operations
- People
- Strategy

**Principle:** Run the enterprise as a connected system.

### DECIDE

- Decisions
- What-if
- Consequences
- Causality

**Principle:** Make trade-offs visible before committing.

### INTELLIGENCE

- Observe
- Explain
- Forecast
- Experiment

**Principle:** Turn information into better judgment, not more noise.

### LEARN

- Concepts
- Skills
- Learn from this

**Principle:** Learning should emerge from decisions and consequences.

### COMPETE

- Multiplayer
- Rivals
- Challenges

**Principle:** Compete on judgment, adaptation and execution.

### LEGACY

- Timeline
- Replay
- Company DNA
- Founder DNA

**Principle:** Make the company's journey visible and worth revisiting.

## 5. Current-route compatibility map

The architecture intentionally maps multiple conceptual surfaces to a smaller number of current routes. This avoids creating a route for every feature.

| Experience surface | Current route | Future experience role |
|---|---|---|
| Markets | `/world` | World lens |
| Economy | `/world` | World lens |
| Competitors | `/world` | World lens |
| Suppliers | `/world` / `/company` | Relationship/context surface |
| Events | `/world` | World event stream |
| Company | `/company` | Enterprise cockpit |
| Finance | `/company` | Enterprise lens |
| Operations | `/company` | Enterprise lens |
| People | `/company` | Enterprise lens |
| Strategy | `/strategy` | Enterprise strategy surface |
| Decisions | `/play` | Decision theater |
| What-if | `/play` | Scenario/counterfactual surface |
| Consequences | `/play` | Reflection surface |
| Causality | `/intelligence` | Explain/causal surface |
| Observe | `/intelligence` | Intelligence workspace |
| Explain | `/intelligence` | Intelligence workspace |
| Forecast | `/intelligence` | Intelligence workspace |
| Experiment | `/intelligence` | Intelligence workspace |
| Concepts | `/learning` | Learning workspace |
| Skills | `/career` | Capability/identity surface |
| Learn from this | `/learning` | Contextual learning |
| Multiplayer | `/competition` | Competitive cockpit |
| Rivals | `/competition` | Competitive intelligence |
| Challenges | `/competition` | Competitive scenarios |
| Timeline | `/endgame` | Legacy timeline |
| Replay | `/endgame` | Historical replay |
| Company DNA | `/endgame` | Company identity |
| Founder DNA | `/career` | Leadership identity |

## 6. Navigation rules

### Rule 1 — Seven primary concepts only

Do not add a new permanent sidebar category for a feature unless it represents a new player mental model.

### Rule 2 — Features live inside concepts

For example, cash flow belongs to Enterprise → Finance. It does not become a top-level navigation item.

### Rule 3 — Context can temporarily promote a surface

A supplier crisis can surface Suppliers from World or Enterprise without changing the permanent navigation model.

### Rule 4 — Search is semantic

Command Center and search should use the same canonical experience registry. Searching `cash`, `competitor`, `why`, `Mumbai`, `replay`, or `strategy` should find the correct experience surface rather than only matching URLs.

### Rule 5 — Mobile is prioritized, not reduced

Each surface has a mobile priority:

- **primary** — reachable directly from the current context/navigation.
- **secondary** — available through contextual navigation or a secondary action.
- **contextual** — surfaced when relevant to the current object/event/decision.

### Rule 6 — No dead-end screens

Every meaningful screen must provide a logical next action such as Explore, Investigate, Explain, Compare, Decide, Act, Reflect or Learn.

## 7. Global object model

The eventual ExperienceShell will treat the following as navigable objects:

- Enterprise
- Person
- Product
- Customer
- Competitor
- Supplier
- Market
- Economy signal
- Event
- Decision
- Metric
- Scenario
- Learning concept

Every object should eventually expose a consistent inspector structure:

```text
IDENTITY
CURRENT STATE
WHY IT MATTERS
RELATIONSHIPS
HISTORY
AVAILABLE ACTIONS
```

This is the foundation for the future Relationship Graph and Causality Graph.

## 8. Global attention model

The architecture reserves a single attention hierarchy for all experiences:

- **Critical** — requires action.
- **Important** — should investigate.
- **Signal** — useful context.
- **Background** — world changed; no immediate action.

Notifications, dashboards, events, decision prompts and returning-player summaries must eventually use this same model.

## 9. Route ownership rule

The current route structure is an implementation detail. The canonical experience registry in `apps/web/app/experience/architecture.ts` is the source of truth for product terminology and navigation semantics.

A future route may host multiple surfaces, and a future surface may move routes, without changing the player's mental model.

## 10. Non-negotiable product principles

1. **The simulation engine remains authoritative.**
2. **UI does not invent simulation facts.**
3. **The interface explains before it overwhelms.**
4. **Major decisions expose trade-offs before commitment.**
5. **Consequences remain traceable.**
6. **Learning is contextual wherever possible.**
7. **Motion communicates state, not decoration.**
8. **Accessibility is part of the interaction model.**
9. **Mobile gets an intentional composition.**
10. **Performance is a UX feature.**
11. **Primary navigation stays stable.**
12. **Every important state has a clear next action.**

## 11. What Step 1 deliberately does not do

This step does **not** rewrite existing simulation logic or redesign every route. It establishes the contract those later changes must follow.

Next implementation stages build on this contract in order:

```text
Experience Architecture
        ↓
Global ExperienceShell
        ↓
Design System
        ↓
Attention + Context + Inspector
        ↓
Enterprise Cockpit
        ↓
World / Enterprise / Decide / Intelligence / Learn / Compete / Legacy
        ↓
Motion + Accessibility + Performance
```
