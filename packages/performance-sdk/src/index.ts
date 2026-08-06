/**
 * @platform/performance-sdk — the shared Performance Analytics Engine SDK.
 *
 * The single source of truth for the Performance Analytics Engine *vocabulary*: the
 * performance-report lifecycle stages (draft → requested → computed → review → approved →
 * published → archived), the status vocabularies (computation, approval, review), the
 * canonical METRIC CATALOG (20 standard metric definitions across return / risk /
 * risk-adjusted / drawdown / trade / exposure / benchmark-relative categories — definitions
 * only), the engine capabilities, the canonical models (PerformanceReport,
 * PerformanceSnapshot, PerformanceSeries, PerformanceMetric, MetricDefinition,
 * MetricCategory, Benchmark, BenchmarkComparison, PerformanceReview, PerformanceArtifact,
 * PerformanceTimelineEvent, …), and pure identifier/version primitives. Consumed by both the
 * performance-analytics service and its UIs.
 *
 * It contains NO formulas, NO metric calculation, NO statistical algorithms, NO Sharpe /
 * CAGR / drawdown computation, NO statistics, NO persistence, NO caching, NO database access,
 * and NO transport. Metric definitions carry a prose `formulaDescription` (never executable
 * code); metric values are computed by the external analytics runtime and carried here as
 * inert data.
 */
export * from './stages';
export * from './statuses';
export * from './metrics';
export * from './capabilities';
export * from './contracts';
export * from './identifiers';
