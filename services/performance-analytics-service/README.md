# performance-analytics-service (Phase 7.1)

The canonical **Performance Analytics Engine** — the analytics engine for evaluating
quantitative strategies, portfolios, backtests and live trading sessions. Consumed by the
researcher (research-web) and administrator (admin-web) UIs, speaking the shared vocabulary
from `@platform/performance-sdk`.

## Report lifecycle

```
Draft → Requested → Computed → Review → Approved → Published → Archived
```

Gates: **Review · Approved**.

## What it is (and is not)

- **Is:** an orchestration + registry service over the performance-report lifecycle and the
  canonical metric catalog, exposing the engine capabilities (performance reports, benchmark
  comparison, portfolio/strategy comparison, historical snapshots, metric versioning, metric
  catalog/registry, reviews, approval) through a pure domain layer and an application layer.
- **Is not:** an analytics runtime. It implements **NO** formulas, **NO** metric calculation,
  **NO** statistical algorithms, **NO** Sharpe/CAGR/drawdown computation, and holds **no**
  persistence/cache/database. Metric values, series points and benchmark values are computed
  by the external Analytics Runtime (behind a port) and supplied as inert data — only reshaped
  for comparison, never calculated. Validation verdicts and approvals are decided elsewhere
  (CP-5); the engine reflects and reroutes them.

## Layering

```
src/application (PerformanceAnalyticsService)
  → src/domain (discovery/search + lifecycle + derivations/comparison)
  → src/infrastructure ports (Report/Family/Comparison/Benchmark query · AnalyticsRuntime ·
    Validation · Workflow · EventBus · Configuration)
```

Only **interfaces** touch infrastructure; concrete adapters are bound in `src/composition.ts`.
In v1 the only adapters are in-memory mocks — swapping in real adapters requires no
application/domain change.
