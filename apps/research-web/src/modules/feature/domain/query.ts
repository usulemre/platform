/**
 * Feature query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { FeatureDto, FeatureStatusDto } from './dto';

export type FeatureSortField = 'name' | 'updatedAt' | 'status' | 'category';
export type SortDir = 'asc' | 'desc';

export interface FeatureQuery {
  readonly search?: string;
  readonly status?: FeatureStatusDto | 'ALL';
  readonly category?: string | 'ALL';
  readonly sortBy?: FeatureSortField;
  readonly sortDir?: SortDir;
}

export function applyFeatureQuery(data: readonly FeatureDto[], query: FeatureQuery): FeatureDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const category = query.category ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((feature) => {
    if (status !== 'ALL' && feature.status !== status) return false;
    if (category !== 'ALL' && feature.category !== category) return false;
    if (search) {
      const haystack =
        `${feature.name} ${feature.description} ${feature.category} ${feature.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'category') comparison = a.category.localeCompare(b.category);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
