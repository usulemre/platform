/**
 * Audit query model + pure query application (search / filter / order / paginate).
 * Data-layer logic, not UI logic. Deterministic. Returns a `Page<AuditEventDto>`.
 */
import type { AuditEventDto, EventCategoryDto, OutcomeDto, Page } from './dto';

export type AuditOrder = 'newest' | 'oldest';

export interface AuditQuery {
  readonly search?: string;
  readonly category?: EventCategoryDto | 'ALL';
  readonly outcome?: OutcomeDto | 'ALL';
  readonly order?: AuditOrder;
  readonly page?: number;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 8;

export function applyAuditQuery(
  data: readonly AuditEventDto[],
  query: AuditQuery,
): Page<AuditEventDto> {
  const search = query.search?.trim().toLowerCase() ?? '';
  const category = query.category ?? 'ALL';
  const outcome = query.outcome ?? 'ALL';
  const order = query.order ?? 'newest';
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE;
  const requestedPage = query.page && query.page > 0 ? query.page : 1;

  const filtered = data.filter((event) => {
    if (category !== 'ALL' && event.category !== category) return false;
    if (outcome !== 'ALL' && event.outcome !== outcome) return false;
    if (search) {
      const haystack =
        `${event.action} ${event.actor.displayName} ${event.target.name} ${event.source} ${event.trace.correlationId} ${event.trace.requestId} ${event.trace.traceId}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const comparison = a.occurredAt.localeCompare(b.occurredAt);
    return order === 'oldest' ? comparison : -comparison;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}
