/**
 * Backtesting Engine module (v1) — the module's public surface for research-web's
 * routing layer. Only container components + route-state atoms are exported; the
 * domain, data and application layers are internal (the app depends on the
 * application layer via these components, never on repositories, the service tier,
 * a broker, a simulation runner, or persistence).
 */
export { BacktestingDashboard } from './components/backtesting-dashboard';
export { BacktestRegistry } from './components/backtest-registry';
export { BacktestDetailView } from './components/backtest-detail-view';
export { BacktestQueues, ExecutionQueue, ApprovalQueue } from './components/backtest-queue';
export { BacktestComparisons, BacktestComparisonView } from './components/backtest-comparisons';
export { BacktestFamilies } from './components/backtest-families';
export { BacktestingLoading, BacktestingError } from './components/backtesting-atoms';
