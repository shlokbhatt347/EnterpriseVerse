# EnterpriseVerse Performance — Phase 1 Baseline

Phase 1 establishes a repeatable performance baseline before further optimization.

## Principles

- Measure before changing hot paths.
- Never trade simulation correctness for a benchmark number.
- Keep performance tests separate from the normal CI correctness suite unless they are deterministic.
- Compare the same machine/runtime and build mode when evaluating improvements.

## Automated simulation baseline

Run:

```bash
pnpm perf:simulation
```

This measures:

1. `createBusiness` over 100 iterations.
2. One warmed-up `advanceDay` followed by 100 timed `advanceDay` calls.

The benchmark prints total and average milliseconds. It intentionally has **no timing threshold**: hardware and CI runners vary, and Phase 1 is for measurement rather than pass/fail performance gates.

## Web baseline to capture before Phase 2

For a production build, record the following from a clean browser session:

| Metric | Baseline | Target after optimization |
| --- | ---: | ---: |
| Initial document response | record | reduce |
| First Contentful Paint | record | reduce |
| Largest Contentful Paint | record | reduce |
| Total JS transferred | record | reduce |
| Initial JS execution | record | reduce |
| Hydration/main-thread blocking | record | reduce |
| Route transition | record | reduce |
| Long tasks >50ms | record | reduce |
| Peak JS heap during a normal session | record | reduce |

Use Chrome/Edge DevTools Performance and Network panels against the production build. Repeat each measurement at least three times and compare the median rather than a single run.

## Simulation baseline to capture

For the benchmark output, record:

- Node version
- pnpm version
- OS/CPU
- `createBusiness` average
- `advanceDay` average

For later phases, add targeted benchmarks for the heaviest simulation subsystems instead of optimizing from source-code intuition alone.

## Database/network baseline

Before changing Supabase hot paths, capture representative latency for:

- authenticated startup
- cloud save
- competition decision submission
- competition room read/update
- enterprise workspace load
- business-event/invitation queries
- realtime event delivery

Record p50 and p95 where possible. Database changes should be validated with query plans and representative data volumes.

## Phase 1 exit criteria

Phase 1 is complete when:

- a dedicated performance branch exists;
- the simulation benchmark is repeatable;
- web measurement categories are defined;
- database/network hot paths are identified;
- subsequent optimizations can be compared against a known baseline.

No production behavior is intentionally changed by Phase 1.
