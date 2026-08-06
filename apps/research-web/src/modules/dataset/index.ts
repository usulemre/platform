/**
 * Dataset Module (v1) — the module's public surface for the app's routing layer.
 * Only container views and state components are exported; the domain, data and
 * application layers are internal (the app depends on the application layer via
 * these views, never on repositories or infrastructure).
 */
export { DatasetsView } from './components/datasets-view';
export { DatasetDetailView } from './components/dataset-detail-view';
export { DatasetLoadingState } from './components/dataset-loading-state';
export { DatasetErrorState } from './components/dataset-error-state';
export { DatasetEmptyState } from './components/dataset-empty-state';
