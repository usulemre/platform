/**
 * Composition root for the tca-service. The single place concrete adapters are bound. In v1 only the
 * in-memory mocks are wired; swapping in real infrastructure (execution store, Market Data Platform,
 * Validation Foundation, Workflow Engine, Audit Center, Notification Center, Event & Messaging
 * Foundation, Configuration Foundation) requires no application/domain change.
 */
import { TcaService } from './application/tca-service';
import {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryExecutionStore,
  InMemoryNotifications,
  StaticConfiguration,
  StubMarketData,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';

export function createTcaService(): TcaService {
  return new TcaService({
    store: new InMemoryExecutionStore(),
    marketData: new StubMarketData(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    audit: new InMemoryAudit(),
    notifications: new InMemoryNotifications(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'tca.alert-total-bps': '50' }),
  });
}

export const tcaService = createTcaService();
