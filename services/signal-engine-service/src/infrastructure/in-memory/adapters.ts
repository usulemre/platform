/**
 * In-memory / stub adapters for the signal-engine service integration and
 * foundation ports. Development/test only — NO storage, NO cache, NO database,
 * NO broker, NO exchange, NO ML, NO external calls. They satisfy the port
 * contracts so the application layer can run against synthetic data; swapping in
 * real adapters (Research Engine, Feature Store, Feature Discovery Engine, Signal
 * Registry, Validation Foundation, Workflow Engine, Event & Messaging Foundation,
 * Configuration Foundation) requires no application/domain change.
 */
import type {
  ConfigurationPort,
  EventBusPort,
  FeatureStorePort,
  SignalCandidate,
  SignalDiscoveryPort,
  SignalEngineEvent,
  SignalRegistryPort,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { SIGNALS, SIGNAL_CANDIDATES } from './seed';

/** Research Engine / Feature Discovery Engine — surfaces candidate signals. */
export class StubSignalDiscovery implements SignalDiscoveryPort {
  constructor(private readonly data: readonly SignalCandidate[] = SIGNAL_CANDIDATES) {}
  async listCandidates(): Promise<readonly SignalCandidate[]> {
    return this.data;
  }
}

/** Feature Store — an upstream feature is approved when a signal depends on it. */
export class StubFeatureStore implements FeatureStorePort {
  async isFeatureApproved(featureRef: string): Promise<boolean> {
    return SIGNALS.some((signal) => signal.definition.featureRefs.includes(featureRef));
  }
}

/** Signal Registry — synchronization state + trigger (ref only). */
export class StubSignalRegistry implements SignalRegistryPort {
  async isRegistered(registryRef: string): Promise<boolean> {
    return SIGNALS.some((signal) => signal.registryRef === registryRef);
  }
  async requestSync(): Promise<void> {
    /* no-op: the real registry decides and performs the sync. */
  }
}

/** Validation Foundation — a signal is validated when it recorded PASSED. */
export class StubValidation implements ValidationPort {
  async isValidated(signalId: string): Promise<boolean> {
    return SIGNALS.find((signal) => signal.id === signalId)?.validation.status === 'PASSED';
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleReview(): Promise<void> {
    /* no-op */
  }
  async scheduleApproval(): Promise<void> {
    /* no-op */
  }
  async schedulePromotion(): Promise<void> {
    /* no-op */
  }
}

/** Event & Messaging Foundation — collects published events in memory. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: SignalEngineEvent[] = [];
  async publish(event: SignalEngineEvent): Promise<void> {
    this.published.push(event);
  }
}

/** Configuration Foundation — static, non-secret configuration by key. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
