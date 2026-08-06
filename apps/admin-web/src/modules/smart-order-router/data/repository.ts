/**
 * SOR repository boundary — the ONLY data abstraction the application service depends on. Concrete
 * adapters implement it; the UI never sees a concrete data source and never touches the service tier,
 * an exchange, a broker, a credential, or persistence.
 */
import type { Routing, Venue } from '@platform/sor-sdk';
import type { RoutingQuery } from '../domain/query';

export type { RoutingQuery };

export interface SorRepository {
  listRoutings(query: RoutingQuery): Promise<readonly Routing[]>;
  listAll(): Promise<readonly Routing[]>;
  getRouting(id: string): Promise<Routing | null>;
  listVenues(): Promise<readonly Venue[]>;
}
