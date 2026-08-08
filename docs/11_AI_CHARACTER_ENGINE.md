# AI Character Engine

EnterpriseVerse characters are stateful agents rather than scripted event generators.

## Character model

Each agent has:

- identity and role
- goals
- risk tolerance
- mood
- trust and relationship scores
- persistent memories
- role-specific economic preferences

## Decision loop

1. Observe the current business state.
2. Score the available actions using the character's preferences.
3. Choose the highest-value action that satisfies constraints.
4. Produce a human-readable rationale.
5. Record a memory with sentiment.
6. Feed the changed relationship/state into future decisions.

## First agents

### Customer

Balances price, affordability, quality, trust and loyalty.

### Supplier

Balances margin, order size, capacity, reliability and relationship.

### Competitor

Chooses between observing, discounting and quality campaigns based on strategy and threat level.

### Investor

Scores traction, profitability, reputation and growth preference before offering capital.

## Product rule

The agent engine must remain deterministic when given the same state. Randomness can be introduced later through a seeded world RNG, but business outcomes must always be explainable from observable inputs.

## Next iteration

The engine will be connected to persistent simulation state, then extended with employee agents, event memory, market-wide interactions and multiplayer student enterprises.
