/**
 * Feature Store module (v1) — the module's public surface for research-web's
 * routing layer. Only container components + route-state atoms are exported; the
 * domain, data and application layers are internal (the app depends on the
 * application layer via these components, never on repositories, the service tier,
 * a broker, or persistence).
 */
export { FeatureStoreDashboard } from './components/feature-store-dashboard';
export { FeatureCatalog } from './components/feature-catalog';
export { FeatureDetailView } from './components/feature-detail-view';
export { FeatureFamilies } from './components/feature-families';
export { FeatureStoreLoading, FeatureStoreError } from './components/feature-store-atoms';
