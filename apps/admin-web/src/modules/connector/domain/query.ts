/**
 * Connector query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { ConnectorDto, ConnectorStatusDto, ConnectorTypeDto } from './dto';

export type ConnectorSortField = 'name' | 'status' | 'updatedAt' | 'type';
export type SortDir = 'asc' | 'desc';

export interface ConnectorQuery {
  readonly search?: string;
  readonly type?: ConnectorTypeDto | 'ALL';
  readonly status?: ConnectorStatusDto | 'ALL';
  readonly sortBy?: ConnectorSortField;
  readonly sortDir?: SortDir;
}

export function applyConnectorQuery(
  data: readonly ConnectorDto[],
  query: ConnectorQuery,
): ConnectorDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const type = query.type ?? 'ALL';
  const status = query.status ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((connector) => {
    if (type !== 'ALL' && connector.type !== type) return false;
    if (status !== 'ALL' && connector.status !== status) return false;
    if (search) {
      const haystack =
        `${connector.name} ${connector.provider} ${connector.owner} ${connector.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'type') comparison = a.type.localeCompare(b.type);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
