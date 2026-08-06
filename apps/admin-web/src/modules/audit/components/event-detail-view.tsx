'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useAuditEvent } from '../hooks/use-audit';
import {
  AuditEmpty,
  AuditError,
  AuditLoading,
  CategoryBadge,
  InfoCard,
  KeyValueList,
  OutcomeBadge,
} from './audit-atoms';

/** Event details container. Shows the event summary, traceability identifiers,
 *  metadata and change history. */
export function EventDetailView({ eventId }: { eventId: string }) {
  const { data, isLoading, isError, refetch } = useAuditEvent(eventId);

  if (isLoading) return <AuditLoading />;
  if (isError) return <AuditError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/audit/explorer">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <AuditEmpty label="No audit event matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to explorer">
          <Link href="/audit/explorer">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.action}</h1>
        <CategoryBadge label={data.categoryLabel} />
        <OutcomeBadge label={data.outcome.label} tone={data.outcome.tone} />
        <span className="text-xs text-muted-foreground">{data.occurredLabel}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Event">
          <KeyValueList rows={data.summary} />
        </InfoCard>
        <InfoCard title="Traceability">
          <KeyValueList rows={data.trace} mono />
        </InfoCard>
        <InfoCard title="Metadata">
          {data.metadata.length === 0 ? (
            <p className="text-sm text-muted-foreground">No additional metadata.</p>
          ) : (
            <KeyValueList rows={data.metadata} />
          )}
        </InfoCard>
        <InfoCard title="Change history">
          {data.changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No field changes recorded.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.changes.map((change) => (
                <li
                  key={change.field}
                  className="flex items-center justify-between gap-4 border-b py-1"
                >
                  <span className="font-medium">{change.field}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {change.from} → {change.to}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
