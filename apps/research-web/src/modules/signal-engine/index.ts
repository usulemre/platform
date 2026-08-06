/**
 * Signal Engine module (v1) — the module's public surface for research-web's
 * routing layer. Only container components + route-state atoms are exported; the
 * domain, data and application layers are internal (the app depends on the
 * application layer via these components, never on repositories, the service tier,
 * a broker, or persistence).
 */
export { SignalEngineDashboard } from './components/signal-engine-dashboard';
export { SignalCatalog } from './components/signal-catalog';
export { SignalDetailView } from './components/signal-detail-view';
export { SignalQueues, PromotionQueue, ApprovalQueue } from './components/signal-queues';
export { SignalFamilies } from './components/signal-families';
export { SignalEngineLoading, SignalEngineError } from './components/signal-engine-atoms';
