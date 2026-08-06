/**
 * @platform/backtesting-sdk — the shared Backtesting Engine SDK.
 *
 * The single source of truth for the Backtesting Engine *vocabulary*: the
 * backtesting project lifecycle stages (draft → configuration → validation →
 * queued → running → completed → review → approved → archived), the run status +
 * run-control predicates (cancel / retry / pause / resume), the engine
 * capabilities, the metric catalog (descriptors only), the canonical models
 * (Backtest, BacktestConfiguration, BacktestScenario, BacktestRun,
 * BacktestSession, BacktestResult, BacktestReport, BacktestComparison,
 * BacktestReview, BacktestApproval, BacktestArtifact, BacktestSnapshot,
 * BacktestVersion, …), and pure identifier/version primitives. Consumed by both
 * the backtesting service and its UI.
 *
 * It contains NO simulation engine, NO performance-metric computation, NO
 * optimization, NO statistics, NO persistence, NO caching, NO database access,
 * and NO transport.
 */
export * from './stages';
export * from './statuses';
export * from './capabilities';
export * from './metrics';
export * from './contracts';
export * from './identifiers';
