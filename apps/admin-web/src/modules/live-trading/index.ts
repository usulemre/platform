/**
 * Live Trading Platform module (v1, admin-web) — the module's public surface for
 * admin-web's routing layer. Only container components are exported; the domain, data and
 * application layers are internal. Self-contained copy: the admin mappers do not deep-link
 * into research-web modules (dependency/lineage cross-links render as plain labels).
 */
export { TradingDashboard } from './components/trading-dashboard';
export { DeploymentRegistry } from './components/deployment-registry';
export { DeploymentDetailView } from './components/deployment-detail-view';
export {
  TradingAccounts,
  ExchangeConnections,
  ApprovalQueue,
  EmergencyControls,
  TradingAudit,
} from './components/trading-views';
export { TradingLoading, TradingError } from './components/trading-atoms';
