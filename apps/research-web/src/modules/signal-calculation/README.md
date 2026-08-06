# signal-calculation module (research-web · Phase 7.4)

The researcher-facing UI for the **Signal Calculation Engine**. Like the feature-calculation module,
its data layer runs the **real** signal-generation library (`@platform/signal-calculation-sdk`, which
derives its features from `@platform/feature-calculation-sdk`) over deterministic synthetic datasets
to produce genuine, live results — no signal is mocked.

## Pages

- **Signal Explorer** — pick any of the 16 real signals, a dataset and parameters, and generate it
  live; see the long/short/flat distribution, active ratio, output preview (direction badges),
  dependency + feature lineage, and the value-range + determinism + point-in-time causality
  validation.
- **Signal Debugger** — inspect the per-bar operands (the real feature/indicator values) that produce
  the signal at each bar.
- **Signal Benchmark** — measure real throughput (mean latency, ops/sec, bars/sec) per signal.
- **Signal Comparison** — agreement, Pearson correlation and joint-direction counts between two
  signals over a dataset.
- **Execution Timeline** / **Performance Overview** — recorded executions and aggregate timing.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + mutations for run/debug/compare)
  → application (SignalCalculationAdminService: result → view-model)
  → data (repository interface · Mock adapter running the real SDK · synthetic data · runner)
  → @platform/signal-calculation-sdk (the real signal generators) → @platform/feature-calculation-sdk (features)
```

## What it is (and is not)

- **Is:** presentation of real computation. Formatting only in the mappers; the generation and
  validation run in the SDK / data layer.
- **Is not:** it holds no signal formulas of its own and no persistence; the mock repository computes
  with the real SDK against seeded synthetic datasets (mock DATA, never mock generation). It shows
  signal values only — no sizing, allocation or execution.

## Routes

`/signal-calculation` (dashboard) · `/explorer` · `/debugger` · `/benchmark` · `/comparison` ·
`/timeline` · `/overview`.
