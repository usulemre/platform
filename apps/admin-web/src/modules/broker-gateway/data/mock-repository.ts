/**
 * In-memory mock adapter for the Broker Gateway UI. Synthetic broker DATA only — NO exchange/broker
 * SDK, NO API keys, NO HTTP/WebSocket/FIX, NO connectivity, no persistence. This is the UI's own mock,
 * independent of the service tier.
 */
import type { Broker } from '@platform/broker-sdk';
import { applyBrokerQuery, type BrokerQuery } from '../domain/query';
import type { GatewayRepository } from './repository';
import { BROKERS } from './seed';

export class MockGatewayRepository implements GatewayRepository {
  async listBrokers(query: BrokerQuery): Promise<readonly Broker[]> {
    return applyBrokerQuery(BROKERS, query);
  }
  async listAll(): Promise<readonly Broker[]> {
    return BROKERS;
  }
  async getBroker(id: string): Promise<Broker | null> {
    return BROKERS.find((b) => b.id === id) ?? null;
  }
}

export { BROKERS };
