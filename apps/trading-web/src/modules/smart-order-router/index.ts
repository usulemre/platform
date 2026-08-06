/**
 * Smart Order Router module (v1, trading-web) — the module's public surface for the app's routing
 * layer. Only container components are exported; the domain, data and application layers are internal.
 * The data layer runs on inert mock routings built by walking legal lifecycle paths (the state machine
 * + policy framework + venue ranking live in `@platform/sor-sdk`). No exchange/broker/FIX.
 */
export { SmartRoutingDashboard } from './components/sor-dashboard';
export { RoutingScopeView } from './components/routing-views';
export { VenueExplorer, VenueHealth, RoutingPolicies } from './components/venue-views';
export { RoutingRules } from './components/routing-rules';
export { RoutingDecisions } from './components/routing-decisions';
export { RoutingMetrics, RoutingHealth } from './components/sor-analytics';
export { RoutingTimeline, RoutingAudit, RoutingReplay } from './components/sor-activity';
export { RoutingDetailView } from './components/routing-detail-view';
export { SorLoading, SorError } from './components/sor-atoms';
