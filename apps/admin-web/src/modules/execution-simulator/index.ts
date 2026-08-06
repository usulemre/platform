/**
 * Execution Simulator module (v1, admin-web) — the module's public surface for
 * admin-web's routing layer. Only container components are exported; the domain, data and
 * application layers are internal (the app depends on the application layer via these
 * components, never on repositories, the service tier, a broker, an exchange, a simulator,
 * or persistence).
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
export { ScenarioTemplates } from './components/scenario-templates';
export {
  SimulationComparisons,
  SimulationComparisonView,
} from './components/simulation-comparisons';
export { ExecutionLoading, ExecutionError } from './components/execution-atoms';
