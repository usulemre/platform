/**
 * Broker Gateway module (v1, trading-web) — the module's public surface for the app's broker gateway.
 * Only container components are exported; the domain, data and application layers are internal. The
 * data layer runs on inert mock brokers, but the lifecycle, health and capability rules come from the
 * REAL `@platform/broker-sdk`. Provider-independent — no exchange/broker/FIX; nothing connects.
 */
export { BrokerDashboard } from './components/broker-dashboard';
export { BrokerRegistry } from './components/broker-registry';
export { BrokerHealth, ConnectivityMonitor } from './components/health-views';
export { ConnectionManager, SessionManager } from './components/connection-session';
export {
  AccountManager,
  PositionSynchronization,
  BalanceSynchronization,
  OrderSynchronization,
} from './components/account-views';
export { CapabilityExplorer } from './components/capability-explorer';
export { GatewayMetrics } from './components/gateway-metrics';
export { GatewayAudit } from './components/gateway-audit';
export { BrokerDetailView } from './components/broker-detail-view';
export { GatewayLoading, GatewayError } from './components/gateway-atoms';
