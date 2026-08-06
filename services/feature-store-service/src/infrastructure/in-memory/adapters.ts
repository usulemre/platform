/**
 * In-memory / stub adapters for the feature-store service integration and
 * foundation ports. Development/test only — NO storage, NO cache, NO database,
 * NO broker, NO external calls. They satisfy the port contracts so the
 * application layer can run against synthetic data; swapping in real adapters
 * (Feature Discovery Engine, Feature Registry, Validation Foundation, Workflow
 * Engine, Event & Messaging Foundation, Configuration Foundation) requires no
 * application/domain change.
 */
import type {
  ConfigurationPort,
  DiscoveryCandidate,
  EventBusPort,
  FeatureDiscoveryPort,
  FeatureRegistryPort,
  FeatureStoreEvent,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { DISCOVERY_CANDIDATES, FEATURES } from './seed';

/** Feature Discovery Engine — surfaces candidate features (ref only). */
export class StubFeatureDiscovery implements FeatureDiscoveryPort {
  constructor(private readonly data: readonly DiscoveryCandidate[] = DISCOVERY_CANDIDATES) {}
  async listCandidates(): Promise<readonly DiscoveryCandidate[]> {
    return this.data;
  }
}

/** Feature Registry — synchronization state + trigger (ref only). */
export class StubFeatureRegistry implements FeatureRegistryPort {
  async isRegistered(registryRef: string): Promise<boolean> {
    return FEATURES.some((feature) => feature.registryRef === registryRef);
  }
  async requestSync(): Promise<void> {
    /* no-op: the real registry decides and performs the sync. */
  }
}

/** Validation Foundation — a feature is validated when it recorded PASSED. */
export class StubValidation implements ValidationPort {
  async isValidated(featureId: string): Promise<boolean> {
    return FEATURES.find((feature) => feature.id === featureId)?.validation === 'PASSED';
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleRegistration(): Promise<void> {
    /* no-op: a real durable workflow is scheduled by the Workflow Engine. */
  }
}

/** Event & Messaging Foundation — collects published events in memory. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: FeatureStoreEvent[] = [];
  async publish(event: FeatureStoreEvent): Promise<void> {
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
