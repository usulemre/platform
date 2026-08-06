/**
 * Infrastructure INTERFACES (ports) for the feature-store service. The
 * application and domain layers depend only on these abstractions; concrete
 * adapters are injected at composition time. NO implementation here: no storage,
 * no cache, no database, no provider. Other subsystems (Feature Discovery Engine,
 * Feature Registry, Research/Signal/Backtesting engines, Market Data Platform)
 * are reached through these abstractions by reference only.
 */
import type { FeatureFamily, RegisteredFeature } from '@platform/feature-store-sdk';

/* ----------------------------- read models ----------------------------- */

export interface FeatureQueryPort {
  list(): Promise<readonly RegisteredFeature[]>;
  getById(id: string): Promise<RegisteredFeature | null>;
}

export interface FamilyQueryPort {
  list(): Promise<readonly FeatureFamily[]>;
}

/* --------------------------- integration ports -------------------------- */

/** A candidate feature proposed by the Feature Discovery Engine (ref only). */
export interface DiscoveryCandidate {
  readonly ref: string;
  readonly name: string;
}

export interface FeatureDiscoveryPort {
  listCandidates(): Promise<readonly DiscoveryCandidate[]>;
}

/** Feature Registry integration — synchronization state + trigger (ref only). */
export interface FeatureRegistryPort {
  isRegistered(registryRef: string): Promise<boolean>;
  requestSync(featureId: string): Promise<void>;
}

/* --------------------------- foundation ports --------------------------- */

/** Validation Foundation — whether a feature cleared its validation gate. */
export interface ValidationPort {
  isValidated(featureId: string): Promise<boolean>;
}

/** Workflow Engine — schedule registration/versioning workflows. */
export interface WorkflowPort {
  scheduleRegistration(featureId: string): Promise<void>;
}

export interface FeatureStoreEvent {
  readonly id: string;
  readonly featureId: string;
  readonly type: 'REGISTERED' | 'VERSIONED' | 'SYNC_REQUESTED' | 'DEPRECATED';
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: FeatureStoreEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
