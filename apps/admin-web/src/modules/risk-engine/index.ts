/**
 * Risk Engine module (v1, admin-web) — the module's public surface for admin-web's
 * routing layer. Only container components are exported; the domain, data and
 * application layers are internal (the app depends on the application layer via these
 * components, never on repositories, the service tier, a broker, a risk model, or
 * persistence).
 */
export { RiskDashboard } from './components/risk-dashboard';
export { RiskRegistry } from './components/risk-registry';
export { RiskDetailView } from './components/risk-detail-view';
export { RiskPolicies, RuleExplorer } from './components/risk-policies';
export { LimitConfiguration } from './components/risk-limits';
export { RiskApprovals, ApprovalQueue, Exceptions, Overrides } from './components/risk-approvals';
export { RiskAuditTimeline } from './components/risk-audit';
export { RiskLoading, RiskError } from './components/risk-engine-atoms';
