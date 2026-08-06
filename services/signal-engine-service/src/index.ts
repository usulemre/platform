/**
 * @services/signal-engine-service — the canonical Signal Engine.
 *
 * The orchestration layer for the quantitative trading signal lifecycle: it
 * transforms approved features into validated signal definitions through a
 * governed research workflow (candidate → research → validation → review →
 * approval → registry → production candidate) and manages signal metadata,
 * lineage, dependencies, versioning, validation status, review, approval and
 * promotion. It integrates with the Research Engine, Feature Store, Feature
 * Discovery Engine, Signal Registry, Validation Foundation, Workflow Engine,
 * Configuration Foundation, Event & Messaging Foundation and Market Data Platform
 * through infrastructure INTERFACES only.
 *
 * It has a pure domain layer (discovery/search, lifecycle rules, derivations), an
 * application layer, and infrastructure ports; the only adapters shipped in v1
 * are in-memory mocks. No alpha models, no signal calculations, no statistics, no
 * ML, no persistence, no caching, no database, no exchange access, no direct
 * infrastructure access.
 */
export * from './domain/discovery';
export * from './domain/lifecycle';
export * from './domain/derivations';

export * from './application/signal-engine-service';

export * from './infrastructure/ports';
export { InMemorySignalQuery, InMemoryFamilyQuery } from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { SIGNALS, FAMILIES, SIGNAL_CANDIDATES } from './infrastructure/in-memory/seed';

export * from './composition';
