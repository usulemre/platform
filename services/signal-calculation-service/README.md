# signal-calculation-service (Phase 7.4)

The canonical **Signal Calculation Engine** — the production computation engine that transforms
quantitative **features** into standardized trading **signals**. **This service performs REAL
computation** (via `@platform/signal-calculation-sdk`, which derives its features from
`@platform/feature-calculation-sdk`); it is not an orchestration/abstraction layer.

## What it does

- **Signal executors** — bind each catalog signal to its real SDK generator over typed OHLCV
  columns (crossovers, RSI/MACD/ROC/momentum, Bollinger/volatility breakouts, z-score reversion,
  volume/ATR/trend filters, rule-engine composite, weighted aggregation, confidence).
- **Execution pipeline** — executor → reproducibility **metadata** → **validation** →
  **cache** / **result registry**, ordered by the **dependency graph** scheduler.
- **Rule Engine & Threshold Engine** — (in the SDK) the declarative rule/threshold evaluators the
  directional and composite signals are built from.
- **Dependency graph** — conceptual signal→signal dependencies (composites depend on their base
  signals) with topological sort, cycle detection and execution levels; plus signal→feature lineage
  (`featureDependenciesOf`) into the Feature Store.
- **Validation pipeline** — real checks: length, finiteness, **value range** (direction/gate/unit),
  **determinism** (byte-identical recompute) and **point-in-time causality** (prefix computation
  equals the full computation's prefix — a look-ahead leak would fail).
- **Metadata generator** — warm-up, finite/active ratio, long/short/flat distribution, input/output
  content hashes and a stable manifest hash (RP-1).
- **Signal comparison** — agreement, correlation and joint-direction counts between two signals.
- **Result registry** & **cache**, **benchmark runner**, and **Signal Registry integration**.

## Guarantees

- **Point-in-time (PIT-3 / CP-3)** — every generator is causal; the causality check is part of
  validation. **Deterministic (RP-1)** — no randomness, no wall-clock in generation; injected
  timer/clock/id keep the pipeline reproducible.
- **Scope** — computes signal values only; it does not size positions, allocate capital or execute.
- **Modular & testable** — pure domain, ports for all IO, in-memory adapters in v1. Synthetic data
  is a seeded PRNG (mock DATA, never mock generation).

## Layering

```
src/application (SignalCalculationService)
  → src/domain (executors · dependency-graph · pipeline · validation · metadata · benchmark · hashing)
  → @platform/signal-calculation-sdk (the real signal generators) → @platform/feature-calculation-sdk (features)
  → src/infrastructure ports (MarketData · SignalStore · SignalCache · SignalResultStore · Workflow · Configuration)
```

`pnpm --filter @services/signal-calculation-service test` runs the engine tests;
`… bench` runs the benchmark suite.
