# Backtesting (research-web UI, Phase 6.8)

The researcher-facing interface for the canonical **Backtesting Engine**, inside
`research-web`. It surfaces the backtesting projects orchestrated by
`services/backtesting-service` (its `ts/` orchestration layer) and speaks the
shared vocabulary from `@platform/backtesting-sdk`.

## What it is (and is not)

- **Is:** a read-only console over the backtesting lifecycle — dashboard, registry
  explorer (search/filter/sort), backtest details (lifecycle, run + controls,
  configuration, metrics overview, validation, results, reports, sessions,
  dependencies, lineage, artifacts, reviews, approval, versions, metadata), the
  execution + approval queue, result comparisons, and backtest families.
- **Is not:** a compute layer. It runs no simulation, computes no performance
  metric, performs no optimization, and contains no business logic in components
  (formatting/aggregation is in the pure mappers/service). Simulations execute in
  the runner; metric values are supplied and only reshaped for comparison — never
  computed. It never validates significance or approves — those verdicts are made
  by deterministic engines and accountable humans and are only reflected here.

## Backtest lifecycle

```
Draft → Configuration → Validation → Queued → Running → Completed → Review → Approved → Archived
```

Run controls (cancel · retry · pause · resume) are shown by availability; the
transitions are executed by the runner.

## Shared contracts

The canonical models and enums (Backtest, BacktestConfiguration, BacktestScenario,
BacktestRun, BacktestSession, BacktestResult, BacktestReport, BacktestComparison,
BacktestReview, BacktestApproval, BacktestArtifact, BacktestVersion, the 9
lifecycle stages, run status + control predicates, and the metric catalog) come
from **`@platform/backtesting-sdk`** — the single source of truth shared with the
service tier.

## Layering

```
components / routes  →  hooks  →  application (BacktestingAdminService)
                                     →  data (BacktestingRepository + Mock/Api)
                                     →  domain (VM / mappers / query, over @platform/backtesting-sdk)
```

Swap `MockBacktestingRepository` for `new ApiBacktestingRepository(apiClient)` in
`application/container.ts` (over the backtesting service gateway) to go live — no
hook/service/UI change.

## Routes

`/backtesting` (dashboard + registry, with loading + error), `/backtesting/[backtestId]`
(details), `/backtesting/queue`, `/backtesting/comparisons`,
`/backtesting/comparisons/[comparisonId]`, `/backtesting/families`. A nav entry and
a "Go to Backtesting" command are wired into research-web; dependencies and lineage
deep-link into the datasets/features/signals/strategies/portfolios/experiments
modules.
