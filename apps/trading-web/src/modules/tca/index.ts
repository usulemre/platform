/**
 * Transaction Cost Analysis (TCA) module (v1, trading-web) — the module's public surface for the app's
 * execution-quality analytics. Only container components are exported; the domain, data and
 * application layers are internal. The data layer runs on inert mock post-trade executions, but every
 * cost figure is produced by the REAL `@platform/tca-sdk` calculations. Broker-independent — no
 * exchange/broker/FIX.
 */
export { TcaDashboard } from './components/tca-dashboard';
export { ExecutionQualityDashboard } from './components/quality-dashboard';
export {
  SlippageAnalytics,
  CommissionAnalytics,
  MarketImpactAnalytics,
} from './components/analytics-views';
export { BenchmarkComparison } from './components/benchmark-comparison';
export { ExecutionCostExplorer } from './components/cost-explorer';
export { VenueComparison } from './components/venue-comparison';
export { ExecutionTimeline, ExecutionReplay } from './components/activity-views';
export { CostReports, CostAttribution, ExecutionScorecards } from './components/reports-views';
export { ExecutionDetailView } from './components/execution-detail-view';
export { TcaLoading, TcaError } from './components/tca-atoms';
