/**
 * Feature Module (v1) — public surface for the app's routing layer. Only
 * container views and route-state components are exported; the domain, data and
 * application layers are internal (the app depends on the application layer via
 * these views, never on repositories or infrastructure).
 */
export { FeatureDashboard } from './components/feature-dashboard';
export { FeaturesView } from './components/features-view';
export { FeatureDetailView } from './components/feature-detail-view';
export { FeatureLoadingState } from './components/feature-loading-state';
export { FeatureErrorState } from './components/feature-error-state';
export { FeatureEmptyState } from './components/feature-empty-state';
