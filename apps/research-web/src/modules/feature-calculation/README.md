# feature-calculation module (research-web · Phase 7.3)

The researcher-facing UI for the **Feature Calculation Engine**. Unlike the other modules, its data
layer runs the **real** calculation library (`@platform/feature-calculation-sdk`) over deterministic
synthetic datasets to produce genuine, live results — no calculation is mocked.

## Pages

- **Calculation Explorer** — pick any of the 22 real calculations, a dataset and parameters, and run
  it live; see the output preview, warm-up, finite ratio, dependency list, and the determinism +
  point-in-time causality validation.
- **Feature Benchmark** — measure real throughput (mean latency, ops/sec, bars/sec) per calculation.
- **Execution History** / **Execution Status** — recorded executions.
- **Performance Metrics** — aggregate timing per calculation.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + mutation for `runCalculation`)
  → application (FeatureCalculationAdminService: result → view-model)
  → data (repository interface · Mock adapter running the real SDK · synthetic data · runner)
  → @platform/feature-calculation-sdk (the real calculations)
```

## What it is (and is not)

- **Is:** presentation of real computation. Formatting only in the mappers; the calculations and
  validation run in the SDK / data layer.
- **Is not:** it holds no calculation formulas of its own and no persistence; the mock repository
  computes with the real SDK against seeded synthetic datasets (mock DATA, never mock calculation).

## Routes

`/feature-calculation` (dashboard) · `/explorer` · `/benchmark` · `/history` · `/status` · `/metrics`.
