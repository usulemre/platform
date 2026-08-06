# performance-analytics module (research-web · Phase 7.1)

The researcher-facing UI for the **Performance Analytics Engine**. A fully layered module that
renders the performance-report lifecycle, reports registry, report details (metrics grouped by
category, series, benchmark comparison, validation, reviews, approval, artifacts, timeline,
dependencies, versions, snapshots), the canonical metric catalog + explorer, benchmark/strategy/
portfolio comparisons and subject-filtered performance (strategy / portfolio / backtest / live) —
reading through the shared vocabulary in `@platform/performance-sdk`.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + Zustand list controls)
  → application (PerformanceAdminService: DTO → view-model)
  → data (repository interface · Mock adapter + seed · Api adapter)
  → domain (dto · query · view-model · mappers)
```

The app depends on this module only through the container components exported from `index.ts`.
In v1 the composition root binds the **Mock** repository (its own synthetic seed); swap in
`ApiPerformanceRepository` (over the performance-analytics service gateway) to go live — no
component/hook/service change.

## What it is (and is not)

- **Is:** presentation. All labels, tones, stage steps, progress, metric grouping, comparison
  tables and the metric catalog are derived by pure mappers so components stay logic-free.
- **Is not:** an analytics runtime. It evaluates **no** formulas, calculates **no** metrics
  (Sharpe, CAGR, drawdown, …), runs **no** statistical algorithms, holds **no** business logic
  and **no** persistence. Metric values, series points and benchmark values are inert supplied
  data computed by the analytics runtime; metric definitions carry a prose formula description,
  never executable code. Series bar widths are presentation-only scaling, never a calculation.

## Routes

`/performance-analytics` (dashboard + registry) · `/[reportId]` (report details) ·
`/catalog` (metric catalog) · `/catalog/[metricKey]` (metric explorer) ·
`/comparisons` (+ `/[comparisonId]`) · `/strategy` · `/portfolio` · `/backtest` · `/live`.
