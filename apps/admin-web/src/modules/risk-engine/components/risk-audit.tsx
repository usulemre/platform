'use client';

import Link from 'next/link';
import { useAuditTimeline } from '../hooks/use-risk-engine';
import { RiskEmpty, RiskError, RiskLoading, InfoCard, StatusBadge } from './risk-engine-atoms';

/** Risk Audit Timeline (admin) — every governance event across the registry, newest first. */
export function RiskAuditTimeline() {
  const { data, isLoading, isError, refetch } = useAuditTimeline();
  if (isLoading) return <RiskLoading />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <RiskEmpty label="No audit entries." />;

  return (
    <InfoCard title="Audit timeline">
      <ol className="space-y-2 text-sm">
        {data.map((entry) => (
          <li key={`${entry.assessmentId}-${entry.id}`} className="border-b py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <StatusBadge label={entry.kind} tone="neutral" />
                <span className="font-medium">{entry.action}</span>
              </span>
              <span className="text-xs text-muted-foreground">{entry.occurredLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {entry.actor} · {entry.detail} ·{' '}
              <Link href={`/risk-engine/${entry.assessmentId}`} className="hover:underline">
                {entry.assessmentName}
              </Link>
            </p>
          </li>
        ))}
      </ol>
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        The audit trail is tamper-evident and append-only — recorded by the Audit Center.
      </p>
    </InfoCard>
  );
}
