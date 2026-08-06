/**
 * Live Trading Platform module (v1, research-web) — the module's public surface for
 * research-web's routing layer. Only container components + route-state atoms are
 * exported; the domain, data and application layers are internal (the app depends on the
 * application layer via these components, never on repositories, the service tier, a
 * broker, an exchange, a credential, or persistence).
 */
export { TradingDashboard } from './components/trading-dashboard';
export { DeploymentRegistry } from './components/deployment-registry';
export { DeploymentDetailView } from './components/deployment-detail-view';
export {
  RunningStrategies,
  ProductionOrders,
  OpenPositions,
  ClosedPositions,
  AccountBalances,
  PortfolioOverview,
  DeploymentHistory,
  TradingAccounts,
  ExchangeConnections,
  ApprovalQueue,
  ProductionHealth,
  TradingMetrics,
  TradingTimeline,
  TradingAudit,
  EmergencyControls,
} from './components/trading-views';
export { TradingLoading, TradingError } from './components/trading-atoms';
