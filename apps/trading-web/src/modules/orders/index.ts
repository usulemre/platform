/**
 * Orders module (v1, trading-web) — the module's public surface for the app's routing layer. Only
 * container components are exported; the domain, data and application layers are internal. The data
 * layer runs on inert mock orders built by walking legal lifecycle paths (the OMS state machine
 * lives in `@platform/order-sdk`). No broker/exchange/FIX.
 */
export { OrdersDashboard } from './components/orders-dashboard';
export { OrderBlotter, OrderSearch } from './components/order-views';
export { OrderMetrics, OrderHealth } from './components/order-analytics';
export { OrderTimeline, OrderAudit, OrderReplay } from './components/order-activity';
export { OrderDetailView } from './components/order-detail-view';
export { OrdLoading, OrdError } from './components/orders-atoms';
