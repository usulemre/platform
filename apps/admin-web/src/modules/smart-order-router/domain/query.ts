/**
 * Routing query model + pure query application (scope / filter / sort). Deterministic; mirrors the
 * SOR service's search so both tiers behave identically.
 */
import {
  isActiveStatus,
  isTerminalStatus,
  type ExecutionMode,
  type Routing,
  type RoutingStatus,
} from '@platform/sor-sdk';

export type RoutingScope = 'ALL' | 'ACTIVE' | 'READY' | 'FAILED' | 'TERMINAL';
export type RoutingSortField = 'createdAt' | 'updatedAt' | 'symbol' | 'status';
export type SortDir = 'asc' | 'desc';

export interface RoutingQuery {
  readonly text?: string;
  readonly scope?: RoutingScope;
  readonly status?: RoutingStatus | 'ALL';
  readonly mode?: ExecutionMode | 'ALL';
  readonly venueId?: string;
  readonly sortBy?: RoutingSortField;
  readonly sortDir?: SortDir;
}

function inScope(routing: Routing, scope: RoutingScope): boolean {
  switch (scope) {
    case 'ALL':
      return true;
    case 'ACTIVE':
      return isActiveStatus(routing.status);
    case 'READY':
      return routing.status === 'EXECUTION_READY';
    case 'FAILED':
      return routing.status === 'ROUTING_FAILED';
    case 'TERMINAL':
      return isTerminalStatus(routing.status);
  }
}

export function applyRoutingQuery(data: readonly Routing[], query: RoutingQuery): Routing[] {
  const text = query.text?.trim().toLowerCase() ?? '';
  const scope = query.scope ?? 'ALL';
  const status = query.status ?? 'ALL';
  const mode = query.mode ?? 'ALL';
  const venueId = query.venueId?.trim() ?? '';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((routing) => {
    if (!inScope(routing, scope)) return false;
    if (status !== 'ALL' && routing.status !== status) return false;
    if (mode !== 'ALL' && routing.mode !== mode) return false;
    if (venueId && routing.decision?.selectedVenueId !== venueId) return false;
    if (text) {
      const haystack =
        `${routing.clientOrderId} ${routing.symbol} ${routing.side} ${routing.assetClass} ${routing.decision?.selectedVenueName ?? ''} ${routing.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(text)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'symbol') comparison = a.symbol.localeCompare(b.symbol);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'createdAt') comparison = a.createdAt.localeCompare(b.createdAt);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });
}
