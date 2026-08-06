/**
 * Composition root for the smart-order-router service. The single place concrete adapters are bound.
 * In v1 only the in-memory mocks are wired; swapping in real infrastructure (routing/venue stores,
 * Connector Management venue registry, Execution Engine hand-off, Risk Engine, Workflow Engine, Audit
 * Center, Notification Center, Event & Messaging Foundation, Configuration Foundation) requires no
 * application/domain change.
 */
import { SmartOrderRouterService } from './application/smart-order-router-service';
import {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryNotifications,
  InMemoryRoutingStore,
  InMemoryVenueStore,
  StaticConfiguration,
  StubExecutionEngine,
  StubRisk,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';

export function createSmartOrderRouterService(): SmartOrderRouterService {
  return new SmartOrderRouterService({
    store: new InMemoryRoutingStore(),
    venues: new InMemoryVenueStore(),
    execution: new StubExecutionEngine(),
    risk: new StubRisk(),
    workflow: new StubWorkflow(),
    audit: new InMemoryAudit(),
    notifications: new InMemoryNotifications(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'sor.default-policy': 'BEST_AVAILABLE' }),
  });
}

export const smartOrderRouterService = createSmartOrderRouterService();
