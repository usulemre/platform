/**
 * Signal query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic — mirrors the service's pure
 * discovery/search so both tiers behave identically.
 */
import type { RegisteredSignal, SignalStage } from '@platform/signal-sdk';

export type SignalSortField = 'name' | 'family' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface SignalQuery {
  readonly search?: string;
  readonly namespace?: string | 'ALL';
  readonly stage?: SignalStage | 'ALL';
  readonly tag?: string;
  readonly sortBy?: SignalSortField;
  readonly sortDir?: SortDir;
}

export function applySignalQuery(
  data: readonly RegisteredSignal[],
  query: SignalQuery,
): RegisteredSignal[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';

  const filtered = data.filter((signal) => {
    if (namespace !== 'ALL' && signal.namespace !== namespace) return false;
    if (stage !== 'ALL' && signal.stage !== stage) return false;
    if (tag && !signal.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (search) {
      const haystack =
        `${signal.name} ${signal.namespace} ${signal.family} ${signal.owner.owner} ${signal.tags.join(' ')}`.toLowerCase();
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
