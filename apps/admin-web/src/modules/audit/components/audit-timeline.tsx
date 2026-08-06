'use client';

import Link from 'next/link';
import { useAuditEvents } from '../hooks/use-audit';
import { AuditEmpty, AuditError, AuditLoading, CategoryBadge, OutcomeBadge } from './audit-atoms';

/**
 * Audit timeline — a chronological (newest-first) feed of recent events,
 * independent of the explorer's filter state. Presentation only.
 */
export function AuditTimeline({ limit = 12 }: { limit?: number }) {
  const { data, isLoading, isError, refetch } = useAuditEvents({
    order: 'newest',
    page: 1,
    pageSize: limit,
  });

  if (isLoading) return <AuditLoading rows={5} />;
  if (isError) return <AuditError onRetry={() => refetch()} />;
  if (!data || data.items.length === 0) return <AuditEmpty label="No recent audit events." />;

  return (
    <ol className="space-y-3">
      {data.items.map((event) => (
        <li key={event.id} className="flex items-start gap-3 text-sm">
          <span
            aria-hidden
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50"
          />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <CategoryBadge label={event.categoryLabel} />
              <Link href={`/audit/${event.id}`} className="font-medium hover:underline">
                {event.action}
              </Link>
              <span className="text-xs text-muted-foreground">{event.actorLabel}</span>
              <OutcomeBadge label={event.outcome.label} tone={event.outcome.tone} />
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{event.occurredLabel}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
