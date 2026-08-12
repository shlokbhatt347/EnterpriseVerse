# Phase 5 — Advanced Enterprise Strategy

## Objective
Turn the living enterprise into a financially and strategically mature company without creating a second simulation engine.

## Core systems
- Capital and financing
- Investors and ownership
- Valuation
- Board governance
- Contracts
- ESG and regulatory exposure
- Strategic partnerships / joint ventures
- M&A
- International expansion (future-ready data model; not required for first release)
- IPO / exit pathways

## Rules
1. The canonical simulation state remains the source of business truth.
2. Advanced strategy actions are deterministic and state-dependent.
3. Major transactions execute atomically.
4. Client previews are informational only; server/simulation state is authoritative.
5. New data is indexed and accessed through compact company-level reads.
6. No feature may add background polling or per-frame work.

## Phase 5 UI
- Finance command center: cash, debt, runway, valuation, funding, ownership.
- Funding wizard: amount → valuation → dilution → investor terms → governance → confirm.
- Board room for major strategic approvals.
- M&A comparison workspace.
- Contract workspace.
- Risk / ESG / regulation panels.
- International expansion is represented as a locked/previewable future capability until its deeper market model exists.

## Performance
- Pure simulation calculations use immutable state and memoized derived reads.
- Strategic actions calculate a preview first, then commit one state transition.
- Persistent company strategy records use a single workspace RPC where practical.
- Database mutations are RPC/transaction based to avoid client-side write waterfalls.
- The UI renders cached/read-model data immediately and updates only affected panels.

## Definition of done
- The company can raise financing with transparent dilution and investor terms.
- Valuation responds to actual company state and financing conditions.
- Mature companies can have board governance.
- Major acquisitions/partnerships are validated and atomic.
- Contracts, ESG, regulation, and risk are visible and consequential.
- Advanced-strategy state survives reload and integrates with existing simulation persistence.
- Unit/regression tests cover core financial/strategy invariants.
- Web/simulation/API CI gates pass.
