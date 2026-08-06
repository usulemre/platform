'use client';

import Link from 'next/link';
import { useRiskReports } from '../hooks/use-risk-engine';
import { RiskEmpty, RiskError, RiskLoading, InfoCard, StatusBadge } from './risk-engine-atoms';

/** Risk Reports — every generated report reference across assessments. */
export function RiskReports() {
  const { data, isLoading, isError, refetch } = useRiskReports();
  if (isLoading) return <RiskLoading />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <RiskEmpty label="No reports generated." />;

  return (
    <InfoCard title="Risk reports">
      <ul className="space-y-1 text-sm">
        {data.map((report) => (
          <li key={report.id} className="flex items-start justify-between gap-4 border-b py-1.5">
            <span>
              <span className="font-medium">{report.title}</span>{' '}
              <StatusBadge label={report.kind} tone="info" />
              <p className="text-xs text-muted-foreground">{report.summary}</p>
              <span className="text-xs text-muted-foreground">
                <Link href={`/risk-engine/${report.assessmentId}`} className="hover:underline">
                  {report.assessmentName}
                </Link>
                {' · '}
                <span className="font-mono">{report.ref}</span>
              </span>
            </span>
            <span className="text-xs text-muted-foreground">{report.generatedLabel}</span>
          </li>
        ))}
      </ul>
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Report artifacts live in the artifact store; only references are surfaced here.
      </p>
    </InfoCard>
  );
}
