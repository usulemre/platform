/**
 * Broker Gateway repository boundary — the ONLY data abstraction the application service depends on.
 * Concrete adapters implement it; the UI never sees a concrete data source and never touches the
 * service tier, an exchange, a broker, a credential, or persistence.
 */
import type { Broker } from '@platform/broker-sdk';
import type { BrokerQuery } from '../domain/query';

export type { BrokerQuery };

export interface GatewayRepository {
  listBrokers(query: BrokerQuery): Promise<readonly Broker[]>;
  listAll(): Promise<readonly Broker[]>;
  getBroker(id: string): Promise<Broker | null>;
}
