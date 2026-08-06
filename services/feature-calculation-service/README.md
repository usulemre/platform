# feature-calculation-service (Phase 7.3)

The canonical **Feature Calculation Engine** — the production computation engine that calculates
quantitative features from canonical market datasets. **This service performs REAL calculations**
(via `@platform/feature-calculation-sdk`); it is not an orchestration/abstraction layer.

## What it does

- **Feature executors** — bind each catalog feature to its real SDK calculation over typed OHLCV
  columns.
- **Execution pipeline** — executor → reproducibility **metadata** → **validation** →
  **cache** / **result registry**, ordered by the **dependency graph** scheduler.
- **Dependency graph** — conceptual dependencies (z-score → mean/std, MACD → EMA, Bollinger → SMA/
  std, ATR → true range), with topological sort, cycle detection and execution levels.
- **Validation pipeline** — real checks: length, finiteness, **determinism** (byte-identical
  recompute) and **point-in-time causality** (prefix computation equals the full computation's
  prefix — a look-ahead leak would fail).
- **Metadata generator** — warm-up, finite ratio, input/output content hashes and a stable
  manifest hash (RP-1).
- **Result registry** & **cache** — store/memoize computed results by manifest hash / cache key.
- **Benchmark runner** — measures real throughput (mean latency, ops/sec, bars/sec).
- **Feature Store integration** — registers computed feature metadata through a port.

## Guarantees

- **Point-in-time (PIT-3 / CP-3)** — every calculation is causal; the causality check is part of
  validation. **Deterministic (RP-1)** — no randomness, no wall-clock in calculations; injected
  timer/clock/id keep the pipeline reproducible.
- **Modular & testable** — pure domain, ports for all IO, in-memory adapters in v1. Synthetic data
  is a seeded PRNG (mock DATA, never mock calculation).

## Layering

```
src/application (FeatureCalculationService)
  → src/domain (executors · dependency-graph · pipeline · validation · metadata · benchmark · hashing)
  → @platform/feature-calculation-sdk (the real calculations)
  → src/infrastructure ports (MarketData · FeatureStore · FeatureCache · FeatureResultStore · Workflow · Configuration)
```

`pnpm --filter @services/feature-calculation-service test` runs the engine tests;
`… bench` runs the benchmark suite.
