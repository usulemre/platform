/**
 * Broker search/scope — deterministic filtering and sorting over the registered brokers. Pure: no IO.
 * Powers the Broker Registry filters.
 */
import {
  isActiveStatus,
  isTerminalStatus,
  type Broker,
  type BrokerStatus,
  type Environment,
  type ProviderId,
} from '@platform/broker-sdk';

export type BrokerScope = 'ALL' | 'ACTIVE' | 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED' | 'ARCHIVED';

export interface BrokerQuery {
  readonly scope?: BrokerScope;
  readonly providerId?: ProviderId;
  readonly status?: BrokerStatus;
  readonly environment?: Environment;
  readonly search?: string;
  readonly sortBy?: 'name' | 'updatedAt' | 'status' | 'healthScore';
  readonly sortDir?: 'asc' | 'desc';
}

function inScope(broker: Broker, scope: BrokerScope): boolean {
  switch (scope) {
    case 'ALL':
      return true;
    case 'ACTIVE':
      return isActiveStatus(broker.status);
    case 'HEALTHY':
      return broker.status === 'HEALTHY';
    case 'DEGRADED':
      return broker.status === 'DEGRADED';
    case 'DISCONNECTED':
      return broker.status === 'DISCONNECTED';
    case 'ARCHIVED':
      return isTerminalStatus(broker.status);
  }
}

export function applyBrokerQuery(
  brokers: readonly Broker[],
  query: BrokerQuery = {},
): readonly Broker[] {
  const term = query.search?.trim().toLowerCase();
  const filtered = brokers.filter((b) => {
    if (query.scope && !inScope(b, query.scope)) return false;
    if (query.providerId && b.providerId !== query.providerId) return false;
    if (query.status && b.status !== query.status) return false;
    if (query.environment && b.environment !== query.environment) return false;
    if (term && !`${b.id} ${b.name} ${b.providerId} ${b.region}`.toLowerCase().includes(term))
      return false;
    return true;
  });
  const sortBy = query.sortBy ?? 'updatedAt';
  const dir = query.sortDir === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const av =
      sortBy === 'name'
        ? a.name
        : sortBy === 'status'
          ? a.status
          : sortBy === 'healthScore'
            ? String(a.health.score).padStart(4, '0')
            : a.updatedAt;
    const bv =
      sortBy === 'name'
        ? b.name
        : sortBy === 'status'
          ? b.status
          : sortBy === 'healthScore'
            ? String(b.health.score).padStart(4, '0')
            : b.updatedAt;
    return av < bv ? -dir : av > bv ? dir : 0;
  });
}
