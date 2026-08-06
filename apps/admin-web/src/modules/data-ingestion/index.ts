/**
 * Data Ingestion admin module (v1) — the module's public surface for admin-web's
 * routing layer. Only container components + route-state atoms are exported; the
 * domain, data and application layers are internal (the app depends on the
 * application layer via these components, never on repositories, the service tier,
 * a broker, or storage).
 */
export { IngestionDashboard } from './components/ingestion-dashboard';
export { PipelineRegistry } from './components/pipeline-registry';
export { PipelineDetailView } from './components/pipeline-detail-view';
export { FailedJobs, RetryQueue } from './components/jobs';
export { IngestionLoading, IngestionError } from './components/ingestion-atoms';
