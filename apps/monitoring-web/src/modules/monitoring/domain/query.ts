/**
 * Service query model + pure query application (search / filter / sort) for the
 * Service Health list. Data-layer logic, not UI logic. Deterministic.
 */
import type { MonitorLevel, ServiceDto } from './dto';

export type ServiceSortField = 'name' | 'category' | 'level';
export type SortDir = 'asc' | 'desc';

export interface ServiceQuery {
  readonly search?: string;
  readonly level?: MonitorLevel | 'ALL';
  readonly sortBy?: ServiceSortField;
  readonly sortDir?: SortDir;
}

const LEVEL_RANK: Record<MonitorLevel, number> = {
  OK: 0,
  NEUTRAL: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

export function applyServiceQuery(data: readonly ServiceDto[], query: ServiceQuery): ServiceDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const level = query.level ?? 'ALL';
  const sortBy = query.sortBy ?? 'level';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((service) => {
    if (level !== 'ALL' && service.level !== level) return false;
    if (search) {
      const haystack = `${service.name} ${service.category}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'category') comparison = a.category.localeCompare(b.category);
    else comparison = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
