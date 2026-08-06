/**
 * Connector Management Platform (v1) — the module's public surface for
 * admin-web's routing layer. Only container components + route-state atoms are
 * exported; the domain, data and application layers are internal (the app
 * depends on the application layer via these components, never on repositories
 * or infrastructure).
 */
export { ConnectorDashboard } from './components/connector-dashboard';
export { ConnectorRegistry } from './components/connector-registry';
export { ConnectorDetailView } from './components/connector-detail-view';
export { ConnectorLoading, ConnectorError } from './components/connector-atoms';
