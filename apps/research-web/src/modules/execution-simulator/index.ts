/**
 * Execution Simulator module (v1, research-web) — the module's public surface for
 * research-web's routing layer. Only container components + route-state atoms are
 * exported; the domain, data and application layers are internal (the app depends on the
 * application layer via these components, never on repositories, the service tier, a
 * broker, an exchange, a simulator, or persistence).
 */
export { ExecutionDashboard } from './components/execution-dashboard';
export { SessionRegistry } from './components/session-registry';
export { SessionDetailView } from './components/session-detail-view';
export {
  ExecutionQueues,
  ExecutionQueue,
  ReviewQueue,
  ApprovalQueue,
} from './components/execution-queues';
export { SimulationHistory } from './components/simulation-history';
export { ExecutionReports } from './components/execution-reports';
export { ExecutionLoading, ExecutionError } from './components/execution-atoms';
