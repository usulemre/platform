/**
 * Agent Module (v1) — the AI Agent Console's public surface for admin-web's
 * routing layer. Only container components are exported; the domain, data and
 * application layers are internal (the app depends on the application layer via
 * these components, never on repositories or infrastructure).
 */
export { AgentDashboard } from './components/agent-dashboard';
export { RegisteredAgents } from './components/registered-agents';
export { AgentDetailView } from './components/agent-detail-view';
export { AgentLoading, AgentError } from './components/agent-atoms';
