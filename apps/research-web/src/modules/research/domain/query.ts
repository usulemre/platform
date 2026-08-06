/**
 * Project query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { ProjectStatus, ResearchProject } from '@platform/research-sdk';

export type ProjectSortField = 'name' | 'status' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface ProjectQuery {
  readonly search?: string;
  readonly status?: ProjectStatus | 'ALL';
  readonly sortBy?: ProjectSortField;
  readonly sortDir?: SortDir;
}

export function applyProjectQuery(
  data: readonly ResearchProject[],
  query: ProjectQuery,
): ResearchProject[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((project) => {
    if (status !== 'ALL' && project.status !== status) return false;
    if (search) {
      const haystack =
        `${project.name} ${project.owner} ${project.team} ${project.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
