/**
 * Composition root for the signal-engine service. The single place concrete
 * adapters are bound. In v1 only the in-memory mocks are wired; swapping in real
 * infrastructure adapters (Research Engine, Feature Store, Feature Discovery
 * Engine, Signal Registry, Validation Foundation, Workflow Engine, Event &
 * Messaging Foundation, Configuration Foundation, read stores) requires no
 * application/domain change.
 */
import { SignalEngineService } from './application/signal-engine-service';
import {
  InMemoryEventBus,
  StaticConfiguration,
  StubFeatureStore,
  StubSignalDiscovery,
  StubSignalRegistry,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import { InMemoryFamilyQuery, InMemorySignalQuery } from './infrastructure/in-memory/repositories';

export function createSignalEngineService(): SignalEngineService {
  return new SignalEngineService({
    signals: new InMemorySignalQuery(),
    families: new InMemoryFamilyQuery(),
    discovery: new StubSignalDiscovery(),
    featureStore: new StubFeatureStore(),
    registry: new StubSignalRegistry(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'signal-engine.default-namespace': 'equities' }),
  });
}

export const signalEngineService = createSignalEngineService();
