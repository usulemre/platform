/**
 * @services/performance-analytics-service — the canonical Performance Analytics Engine.
 *
 * The analytics engine for evaluating quantitative strategies, portfolios, backtests and
 * live trading sessions. It provides standardized performance analysis via the canonical
 * metric catalog, reporting models and evaluation workflows: it manages the report lifecycle
 * (draft → requested → computed → review → approved → published → archived) and coordinates
 * benchmark comparison, historical snapshots, metric versioning, reviews and approvals. It
 * integrates with the Backtesting Engine, Execution Simulator, Live Trading Platform,
 * Portfolio Construction Engine, Research Engine, Validation Foundation, Workflow Engine,
 * Configuration Foundation and Monitoring Module through infrastructure INTERFACES only.
 *
 * It has a pure domain layer (discovery/search, lifecycle rules, derivations + comparison
 * assembly), an application layer, and infrastructure ports; the only adapters shipped in v1
 * are in-memory mocks. It contains NO formulas, NO metric calculation, NO statistical
 * algorithms, NO Sharpe/CAGR/drawdown computation, no statistics, no persistence, no caching,
 * no database, no direct infrastructure access. Metric values are computed by the external
 * analytics runtime and reflected here.
 */
export * from './domain/discovery';
export * from './domain/lifecycle';
export * from './domain/derivations';

export * from './application/performance-analytics-service';

export * from './infrastructure/ports';
export {
  InMemoryBenchmarkQuery,
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
  InMemoryReportQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { REPORTS, FAMILIES, COMPARISONS, BENCHMARKS } from './infrastructure/in-memory/seed';

export * from './composition';
