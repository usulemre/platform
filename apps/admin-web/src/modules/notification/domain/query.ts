/**
 * Notification query model + pure query application (search / filter / order /
 * paginate). Data-layer logic, not UI logic. Deterministic. Returns a
 * `Page<NotificationDto>`.
 */
import type {
  NotificationCategoryDto,
  NotificationDto,
  NotificationStatusDto,
  Page,
  PriorityDto,
} from './dto';

export type NotificationOrder = 'newest' | 'oldest' | 'priority';

export interface NotificationQuery {
  readonly search?: string;
  readonly category?: NotificationCategoryDto | 'ALL';
  readonly priority?: PriorityDto | 'ALL';
  readonly status?: NotificationStatusDto | 'ALL';
  readonly order?: NotificationOrder;
  readonly page?: number;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 8;

const PRIORITY_RANK: Record<PriorityDto, number> = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function applyNotificationQuery(
  data: readonly NotificationDto[],
  query: NotificationQuery,
): Page<NotificationDto> {
  const search = query.search?.trim().toLowerCase() ?? '';
  const category = query.category ?? 'ALL';
  const priority = query.priority ?? 'ALL';
  const status = query.status ?? 'ALL';
  const order = query.order ?? 'newest';
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE;
  const requestedPage = query.page && query.page > 0 ? query.page : 1;

  const filtered = data.filter((notification) => {
    if (category !== 'ALL' && notification.category !== category) return false;
    if (priority !== 'ALL' && notification.priority !== priority) return false;
    if (status !== 'ALL' && notification.status !== status) return false;
    if (search) {
      const haystack =
        `${notification.title} ${notification.body} ${notification.source}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (order === 'priority') {
      const byPriority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (byPriority !== 0) return byPriority;
      return b.createdAt.localeCompare(a.createdAt);
    }
    const comparison = a.createdAt.localeCompare(b.createdAt);
    return order === 'oldest' ? comparison : -comparison;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}
