/**
 * Pipeline query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { DataType, PipelineRecord, PipelineStatus } from '@platform/data-sdk';

export type PipelineSortField = 'name' | 'status' | 'updatedAt' | 'dataType';
export type SortDir = 'asc' | 'desc';

export interface PipelineQuery {
  readonly search?: string;
  readonly dataType?: DataType | 'ALL';
  readonly status?: PipelineStatus | 'ALL';
  readonly sortBy?: PipelineSortField;
  readonly sortDir?: SortDir;
}

export function applyPipelineQuery(
  data: readonly PipelineRecord[],
  query: PipelineQuery,
): PipelineRecord[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const dataType = query.dataType ?? 'ALL';
  const status = query.status ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((pipeline) => {
    if (dataType !== 'ALL' && pipeline.dataType !== dataType) return false;
    if (status !== 'ALL' && pipeline.status !== status) return false;
    if (search) {
      const haystack =
        `${pipeline.name} ${pipeline.source.name} ${pipeline.owner} ${pipeline.dataType}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'dataType') comparison = a.dataType.localeCompare(b.dataType);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
