'use client';

import Link from 'next/link';
import { useExposureSummary } from '../hooks/use-risk-engine';
import { RiskEmpty, RiskError, RiskLoading, InfoCard, StatusBadge } from './risk-engine-atoms';

/** Exposure Summary — reported exposures grouped by assessment (values supplied). */
export function ExposureSummary() {
  const { data, isLoading, isError, refetch } = useExposureSummary();
  if (isLoading) return <RiskLoading />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <RiskEmpty label="No exposures reported." />;

  return (
    <div className="space-y-4">
      {data.map((row) => (
        <InfoCard
          key={row.assessmentId}
          title={row.assessmentName}
          action={
            <Link href={`/risk-engine/${row.assessmentId}`} className="text-sm hover:underline">
              Open
            </Link>
          }
        >
          <p className="mb-2 text-xs uppercase text-muted-foreground">{row.namespace}</p>
          <ul className="space-y-1 text-sm">
            {row.exposures.map((exposure) => (
              <li
                key={exposure.id}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                <span className="flex items-center gap-2">
                  <StatusBadge label={exposure.dimension} tone="neutral" />
                  <span className="font-medium">{exposure.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {exposure.value} / {exposure.limit}
                  </span>
                </span>
                <StatusBadge label={exposure.status.label} tone={exposure.status.tone} />
              </li>
            ))}
          </ul>
        </InfoCard>
      ))}
      <p role="note" className="text-xs text-muted-foreground">
        Exposures are produced by the external risk model — never calculated by this console.
      </p>
    </div>
  );
}
