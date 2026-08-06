/**
 * Session query model + pure query application (search / filter / sort). Data-layer
 * logic, not UI logic. Deterministic — mirrors the service's pure discovery/search so
 * both tiers behave identically.
 */
import type { SimulationSession, SimulationStage } from '@platform/execution-sdk';

export type SessionSortField = 'name' | 'family' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface SessionQuery {
  readonly search?: string;
  readonly namespace?: string | 'ALL';
  readonly stage?: SimulationStage | 'ALL';
  readonly tag?: string;
  readonly sortBy?: SessionSortField;
  readonly sortDir?: SortDir;
}

export function applySessionQuery(
  data: readonly SimulationSession[],
  query: SessionQuery,
): SimulationSession[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';

  const filtered = data.filter((session) => {
    if (namespace !== 'ALL' && session.namespace !== namespace) return false;
    if (stage !== 'ALL' && session.stage !== stage) return false;
    if (tag && !session.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (search) {
      const haystack =
        `${session.name} ${session.namespace} ${session.family} ${session.owner.owner} ${session.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'family')
      comparison = `${a.namespace}/${a.family}`.localeCompare(`${b.namespace}/${b.family}`);
    else if (sortBy === 'updatedAt') comparison = a.updatedAt.localeCompare(b.updatedAt);
    else comparison = a.name.localeCompare(b.name);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
