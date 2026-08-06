/**
 * @services/feature-store-service — the canonical Feature Store.
 *
 * The single source of truth for every approved feature: it manages feature
 * lifecycle, versioning, metadata, lineage, dependencies, discovery and registry
 * synchronization, and provides reusable feature access across research,
 * backtesting, signal generation and production execution. It integrates with the
 * Feature Discovery Engine, the Feature Registry, the Validation Foundation, the
 * Workflow Engine and the Configuration Foundation through infrastructure
 * INTERFACES only.
 *
 * It has a pure domain layer (discovery/search + derivations), an application
 * layer, and infrastructure ports; the only adapters shipped in v1 are in-memory
 * mocks. No feature calculations, no statistics, no persistence, no caching, no
 * database, no direct infrastructure access.
 */
export * from './domain/discovery';
export * from './domain/derivations';

export * from './application/feature-store-service';

export * from './infrastructure/ports';
export { InMemoryFeatureQuery, InMemoryFamilyQuery } from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { FEATURES, FAMILIES, DISCOVERY_CANDIDATES } from './infrastructure/in-memory/seed';

export * from './composition';
