/**
 * Composition root for the feature-store service. The single place concrete
 * adapters are bound. In v1 only the in-memory mocks are wired; swapping in real
 * infrastructure adapters (Feature Discovery Engine, Feature Registry, Validation
 * Foundation, Workflow Engine, Event & Messaging Foundation, Configuration
 * Foundation, read stores) requires no application/domain change.
 */
import { FeatureStoreService } from './application/feature-store-service';
import {
  InMemoryEventBus,
  StaticConfiguration,
  StubFeatureDiscovery,
  StubFeatureRegistry,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import { InMemoryFamilyQuery, InMemoryFeatureQuery } from './infrastructure/in-memory/repositories';

export function createFeatureStoreService(): FeatureStoreService {
  return new FeatureStoreService({
    features: new InMemoryFeatureQuery(),
    families: new InMemoryFamilyQuery(),
    discovery: new StubFeatureDiscovery(),
    registry: new StubFeatureRegistry(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'feature-store.default-namespace': 'equities' }),
  });
}

export const featureStoreService = createFeatureStoreService();
