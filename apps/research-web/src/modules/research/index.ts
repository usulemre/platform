/**
 * Research Engine module (v1) — the module's public surface for research-web's
 * routing layer. Only container components + route-state atoms are exported; the
 * domain, data and application layers are internal (the app depends on the
 * application layer via these components, never on repositories, the service tier,
 * a broker, or persistence).
 */
export { ResearchDashboard } from './components/research-dashboard';
export { ResearchRegistry } from './components/research-registry';
export { ProjectDetailView } from './components/project-detail-view';
export { ResearchTemplates } from './components/research-templates';
export { ResearchLoading, ResearchError } from './components/research-atoms';
