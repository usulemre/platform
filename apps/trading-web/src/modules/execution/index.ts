/**
 * Execution module (v1, trading-web) — the module's public surface for the app's routing layer. Only
 * container components are exported; the domain, data and application layers are internal. The data
 * layer runs on inert mock executions built by walking legal lifecycle paths (the state machine +
 * policy framework live in `@platform/execution-engine-sdk`). No broker/exchange/FIX.
 */
export { ExecutionDashboard } from './components/execution-dashboard';
export { ExecutionScopeView } from './components/execution-views';
export { ExecutionPlanner } from './components/execution-planner';
export { ExecutionPolicies } from './components/execution-policies';
export { ExecutionSessions } from './components/execution-sessions';
export { ExecutionMetrics, ExecutionHealth } from './components/execution-analytics';
export {
  ExecutionTimeline,
  ExecutionAudit,
  ExecutionReplay,
} from './components/execution-activity';
export { ExecutionDetailView } from './components/execution-detail-view';
export { ExecLoading, ExecError } from './components/execution-atoms';
