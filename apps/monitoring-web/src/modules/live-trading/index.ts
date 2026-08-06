/**
 * Live Trading Platform module (v1, monitoring-web) — the module's public surface for
 * monitoring-web's routing layer. Read-only production visibility. Only container
 * components are exported; the domain, data and application layers are internal.
 * Self-contained copy: the monitoring mappers do not deep-link into research-web modules
 * (dependency/lineage cross-links render as plain labels).
 */
export { TradingDashboard } from './components/trading-dashboard';
export { DeploymentDetailView } from './components/deployment-detail-view';
export {
  RunningStrategies,
  ProductionHealth,
  TradingMetrics,
  TradingTimeline,
  EmergencyControls,
} from './components/trading-views';
export { TradingLoading, TradingError } from './components/trading-atoms';
