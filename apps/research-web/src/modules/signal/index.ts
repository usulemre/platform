/**
 * Signal Module (v1) — public surface for the app's routing layer. Only container
 * views and route-state components are exported; the domain, data and application
 * layers are internal (the app depends on the application layer via these views,
 * never on repositories or infrastructure).
 */
export { SignalDashboard } from './components/signal-dashboard';
export { SignalsView } from './components/signals-view';
export { SignalDetailView } from './components/signal-detail-view';
export { SignalLoadingState } from './components/signal-loading-state';
export { SignalErrorState } from './components/signal-error-state';
export { SignalEmptyState } from './components/signal-empty-state';
