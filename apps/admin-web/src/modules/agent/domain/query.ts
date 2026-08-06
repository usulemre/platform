/**
 * Agent query model + pure query application (search / filter / sort). Data-layer
 * logic, not UI logic. Deterministic.
 */
import type { AgentAuthorityDto, AgentDto, AgentStatusDto } from './dto';

export type AgentSortField = 'name' | 'status' | 'updatedAt' | 'category';
export type SortDir = 'asc' | 'desc';

export interface AgentQuery {
  readonly search?: string;
  readonly status?: AgentStatusDto | 'ALL';
  readonly authority?: AgentAuthorityDto | 'ALL';
  readonly sortBy?: AgentSortField;
  readonly sortDir?: SortDir;
}

export function applyAgentQuery(data: readonly AgentDto[], query: AgentQuery): AgentDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const authority = query.authority ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((agent) => {
    if (status !== 'ALL' && agent.status !== status) return false;
    if (authority !== 'ALL' && agent.authority !== authority) return false;
    if (search) {
      const haystack =
        `${agent.name} ${agent.category} ${agent.owner} ${agent.tags.join(' ')}`.toLowerCase();
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
