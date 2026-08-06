/**
 * Risk Engine module (v1, research-web) — the module's public surface for research-web's
 * routing layer. Only container components + route-state atoms are exported; the domain,
 * data and application layers are internal (the app depends on the application layer via
 * these components, never on repositories, the service tier, a broker, a risk model, or
 * persistence).
 */
export { RiskDashboard } from './components/risk-dashboard';
export { RiskRegistry } from './components/risk-registry';
export { RiskDetailView } from './components/risk-detail-view';
export {
  RiskReviewQueues,
  ValidationQueue,
  ReviewQueue,
  ApprovalQueue,
  ExceptionQueue,
} from './components/risk-queues';
export { ExposureSummary } from './components/exposure-summary';
export { RiskReports } from './components/risk-reports';
export { RiskLoading, RiskError } from './components/risk-engine-atoms';
