/**
 * Monitoring Module (v1) — public surface for the app's routing layer. Only
 * container components are exported; the domain, data and application layers are
 * internal (the app depends on the application layer via these components, never
 * on repositories or infrastructure).
 */
export { MonitoringDashboard } from './components/monitoring-dashboard';
export { ServiceListView } from './components/service-list';
export { MonitorLoading, MonitorError } from './components/monitoring-atoms';
