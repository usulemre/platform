/**
 * In-memory mock adapter for the SOR UI. Synthetic routing DATA only — NO exchange/broker SDK, NO API
 * keys, NO HTTP/WebSocket/FIX, NO connectivity, no persistence. The routings are built by walking
 * legal lifecycle paths so their event logs replay consistently. This is the UI's own mock,
 * independent of the service tier.
 */
import type { Routing, Venue } from '@platform/sor-sdk';
import { applyRoutingQuery, type RoutingQuery } from '../domain/query';
import type { SorRepository } from './repository';
import { ROUTINGS, VENUES } from './seed';

export class MockSorRepository implements SorRepository {
  async listRoutings(query: RoutingQuery): Promise<readonly Routing[]> {
    return applyRoutingQuery(ROUTINGS, query);
  }
  async listAll(): Promise<readonly Routing[]> {
    return ROUTINGS;
  }
  async getRouting(id: string): Promise<Routing | null> {
    return ROUTINGS.find((routing) => routing.id === id) ?? null;
  }
  async listVenues(): Promise<readonly Venue[]> {
    return VENUES;
  }
}

export { ROUTINGS, VENUES };
