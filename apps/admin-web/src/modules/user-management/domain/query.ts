/**
 * User query model + pure query application (search / filter / sort / paginate).
 * Data-layer logic, not UI logic. Deterministic. Returns a `Page<UserDto>`.
 */
import type { Page, UserDto, UserStatusDto } from './dto';

export type UserSortField = 'name' | 'status' | 'lastActive';
export type SortDir = 'asc' | 'desc';

export interface UserQuery {
  readonly search?: string;
  readonly status?: UserStatusDto | 'ALL';
  readonly role?: string | 'ALL';
  readonly group?: string | 'ALL';
  readonly sortBy?: UserSortField;
  readonly sortDir?: SortDir;
  readonly page?: number;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 5;

export function applyUserQuery(data: readonly UserDto[], query: UserQuery): Page<UserDto> {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const role = query.role ?? 'ALL';
  const group = query.group ?? 'ALL';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE;
  const requestedPage = query.page && query.page > 0 ? query.page : 1;

  const filtered = data.filter((user) => {
    if (status !== 'ALL' && user.status !== status) return false;
    if (role !== 'ALL' && !user.roles.includes(role)) return false;
    if (group !== 'ALL' && !user.groups.includes(group)) return false;
    if (search) {
      const haystack =
        `${user.displayName} ${user.username} ${user.email} ${user.team}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'lastActive') comparison = a.lastActiveAt.localeCompare(b.lastActiveAt);
    else comparison = a.displayName.localeCompare(b.displayName);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}
