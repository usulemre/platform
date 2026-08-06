/**
 * Composition root for the live-trading service. The single place concrete adapters are
 * bound. In v1 only the in-memory mocks are wired; swapping in real infrastructure
 * adapters (Risk Engine, Validation Foundation, Authentication, Connector Management /
 * broker gateway, Workflow Engine, Event & Messaging Foundation, Audit Center,
 * Notification Center, Configuration Foundation, read stores) requires no
 * application/domain change.
 */
import { LiveTradingService } from './application/live-trading-service';
import {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryNotifications,
  StaticConfiguration,
  StubAuthorization,
  StubBrokerGateway,
  StubRisk,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryAccountQuery,
  InMemoryConnectionQuery,
  InMemoryDeploymentQuery,
  InMemoryFamilyQuery,
} from './infrastructure/in-memory/repositories';

export function createLiveTradingService(): LiveTradingService {
  return new LiveTradingService({
    deployments: new InMemoryDeploymentQuery(),
    families: new InMemoryFamilyQuery(),
    accounts: new InMemoryAccountQuery(),
    connections: new InMemoryConnectionQuery(),
    risk: new StubRisk(),
    validation: new StubValidation(),
    authorization: new StubAuthorization(),
    broker: new StubBrokerGateway(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    audit: new InMemoryAudit(),
    notifications: new InMemoryNotifications(),
    config: new StaticConfiguration({ 'trading.default-mode': 'PAPER' }),
  });
}

export const liveTradingService = createLiveTradingService();
