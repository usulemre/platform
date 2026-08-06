'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { History } from 'lucide-react';
import { useAuditEvents } from '../hooks/use-monitoring';
import { MonitorEmpty, MonitorError, MonitorLoading } from './monitoring-atoms';

/** Audit timeline — recent audit events (tamper-evident trail is upstream). */
export function AuditTimeline() {
  const { data, isLoading, isError, refetch } = useAuditEvents();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-muted-foreground" />
          Audit timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <MonitorLoading rows={4} />
        ) : isError ? (
          <MonitorError onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <MonitorEmpty label="No recent audit events." />
        ) : (
          <ol className="space-y-3">
            {data.map((event) => (
              <li key={event.id} className="flex items-start gap-3 text-sm">
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50"
                />
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{event.actor}</span>{' '}
                    <span className="text-muted-foreground">{event.action}</span>{' '}
                    <span className="font-mono text-xs">{event.target}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {event.occurredLabel}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
