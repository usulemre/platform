/**
 * Composition root for the broker-gateway service. The single place concrete adapters are bound —
 * including the **provider registry**, where every `@platform/providers/*` package contributes its
 * (placeholder) factory. This is the one seam that decides which providers exist; swapping a
 * placeholder for a live adapter is a change here and nowhere else (dependency injection). In v1 only
 * in-memory infrastructure and placeholder providers are wired.
 */
import type { BrokerProviderFactory } from '@platform/broker-sdk';
import { providerFactories as binance } from '@platform/provider-binance';
import { providerFactories as hyperliquid } from '@platform/provider-hyperliquid';
import { providerFactories as deribit } from '@platform/provider-deribit';
import { providerFactories as interactiveBrokers } from '@platform/provider-interactive-brokers';
import { providerFactories as alpaca } from '@platform/provider-alpaca';
import { providerFactories as bist } from '@platform/provider-bist';
import { providerFactories as fix } from '@platform/provider-fix';
import { providerFactories as rest } from '@platform/provider-rest';
import { providerFactories as websocket } from '@platform/provider-websocket';
import { BrokerGatewayService } from './application/broker-gateway-service';
import {
  InMemoryAudit,
  InMemoryBrokerStore,
  InMemoryEventBus,
  InMemoryMonitoring,
  InMemoryNotifications,
  InMemoryProviderRegistry,
  StaticConfiguration,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';

/** Every provider package's factories, merged into a single id → factory registry. */
export const PROVIDER_FACTORIES: Readonly<Record<string, BrokerProviderFactory>> = {
  ...binance,
  ...hyperliquid,
  ...deribit,
  ...interactiveBrokers,
  ...alpaca,
  ...bist,
  ...fix,
  ...rest,
  ...websocket,
};

export function createBrokerGatewayService(): BrokerGatewayService {
  return new BrokerGatewayService({
    store: new InMemoryBrokerStore(),
    providers: new InMemoryProviderRegistry(PROVIDER_FACTORIES),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    audit: new InMemoryAudit(),
    notifications: new InMemoryNotifications(),
    monitoring: new InMemoryMonitoring(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'gateway.default-environment': 'PAPER' }),
  });
}

export const brokerGatewayService = createBrokerGatewayService();
