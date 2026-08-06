# @platform/performance-sdk (Phase 7.1)

The shared **Performance Analytics Engine** SDK — the single source of truth for the engine
_vocabulary_ spoken by the `performance-analytics-service` and the researcher (research-web)
and administrator (admin-web) UIs.

## Report lifecycle

```
Draft → Requested → Computed → Review → Approved → Published → Archived
```

Gates: **Review · Approved**.

## Metric catalog (definitions only)

20 canonical metric **definitions** across 7 categories — return, risk, risk-adjusted,
drawdown, trade, exposure and benchmark-relative: total return, annual return, CAGR,
volatility, Sharpe, Sortino, Calmar, maximum drawdown, average drawdown, recovery time, win
rate, profit factor, expectancy, average trade, turnover, exposure, alpha, beta, information
ratio, tracking error. Each definition carries a prose `formulaDescription` — **never
executable code**.

## What it is (and is not)

- **Is:** the lifecycle stages, status vocabularies, the canonical metric catalog
  (definitions + categories + versioning), engine capabilities and the canonical models
  (`PerformanceReport`, `PerformanceSnapshot`, `PerformanceSeries`, `PerformanceMetric`,
  `MetricDefinition`, `Benchmark`, `BenchmarkComparison`, `PerformanceReview`,
  `PerformanceArtifact`, …) plus pure identifier/version helpers.
- **Is not:** an analytics runtime. It contains **NO** formulas, **NO** metric calculation,
  **NO** statistical algorithms, **NO** Sharpe/CAGR/drawdown computation, and **no**
  persistence, cache, database or transport. Subjects are referenced by **ref**; metric
  values, series points and benchmark values are inert supplied strings computed by the
  external analytics runtime.
