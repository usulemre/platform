/**
 * Infrastructure INTERFACES (ports) for the signal-engine service. The
 * application and domain layers depend only on these abstractions; concrete
 * adapters are injected at composition time. NO implementation here: no storage,
 * no cache, no database, no broker, no exchange, no ML. Other subsystems
 * (Research Engine, Feature Store, Feature Discovery Engine, Signal Registry,
 * Validation Foundation, Workflow Engine, Configuration Foundation, Market Data
 * Platform) are reached through these abstractions by reference only.
 */
import type { RegisteredSignal, SignalFamily } from '@platform/signal-sdk';

/* ----------------------------- read models ----------------------------- */

export interface SignalQueryPort {
  list(): Promise<readonly RegisteredSignal[]>;
  getById(id: string): Promise<RegisteredSignal | null>;
}

export interface FamilyQueryPort {
  list(): Promise<readonly SignalFamily[]>;
}

/* --------------------------- integration ports -------------------------- */

/** A candidate signal proposed by research / the Feature Discovery Engine (ref only). */
export interface SignalCandidate {
  readonly ref: string;
  readonly name: string;
  readonly source: 'RESEARCH' | 'FEATURE_DISCOVERY';
}

export interface SignalDiscoveryPort {
  listCandidates(): Promise<readonly SignalCandidate[]>;
}

/** Feature Store — resolve that an upstream approved feature exists (ref only). */
export interface FeatureStorePort {
  isFeatureApproved(featureRef: string): Promise<boolean>;
}

/** Signal Registry integration — synchronization state + trigger (ref only). */
export interface SignalRegistryPort {
  isRegistered(registryRef: string): Promise<boolean>;
  requestSync(signalId: string): Promise<void>;
}

/* --------------------------- foundation ports --------------------------- */

/** Validation Foundation — whether a signal cleared its validation gate. */
export interface ValidationPort {
  isValidated(signalId: string): Promise<boolean>;
}

/** Workflow Engine — schedule research/validation/review/approval/promotion workflows. */
export interface WorkflowPort {
  scheduleReview(signalId: string): Promise<void>;
  scheduleApproval(signalId: string): Promise<void>;
  schedulePromotion(signalId: string): Promise<void>;
}

export interface SignalEngineEvent {
  readonly id: string;
  readonly signalId: string;
  readonly type:
    | 'REGISTERED'
    | 'VERSIONED'
    | 'REVIEW_REQUESTED'
    | 'APPROVAL_REQUESTED'
    | 'PROMOTION_QUEUED'
    | 'SYNC_REQUESTED';
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: SignalEngineEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
