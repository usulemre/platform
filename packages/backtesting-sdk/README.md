# @platform/backtesting-sdk

The shared **Backtesting Engine SDK** (Phase 6.8) — the single source of truth for
the Backtesting Engine vocabulary, consumed by both the `backtesting-service` and
its researcher-facing UI.

## Contents

- **Stages** (`stages.ts`) — the 9-stage backtesting lifecycle (draft →
  configuration → validation → queued → running → completed → review → approved →
  archived), with gate flags and pure ordering.
- **Statuses** (`statuses.ts`) — run status (queued/running/paused/completed/
  failed/cancelled) with the run-control predicates `canCancel`, `canRetry`,
  `canPause`, `canResume`, plus validation / approval / review / dependency enums.
- **Capabilities** (`capabilities.ts`) — historical simulations, walk-forward,
  rolling windows, parameter sets, scenario management, result comparison, metric
  catalog, and experiment/signal/feature/dataset/portfolio linking.
- **Metrics** (`metrics.ts`) — the metric CATALOG (descriptors only; nothing is
  computed).
- **Contracts** (`contracts.ts`) — the canonical models: Backtest,
  BacktestConfiguration, BacktestScenario, BacktestRun, BacktestSession,
  BacktestResult, BacktestReport, BacktestComparison, BacktestReview,
  BacktestApproval, BacktestArtifact, BacktestSnapshot, BacktestVersion, metadata.
- **Identifiers** (`identifiers.ts`) — pure backtest-key and semantic-version
  primitives.

## Boundaries

Vocabulary and pure logic only. **No** simulation engine, **no** performance-metric
computation, **no** optimization, **no** statistics, **no** persistence, **no**
caching, **no** database access, **no** transport.
