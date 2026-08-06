'use client';

import Link from 'next/link';
import { useLimitConfiguration } from '../hooks/use-risk-engine';
import { RiskEmpty, RiskError, RiskLoading, InfoCard, StatusBadge } from './risk-engine-atoms';

/** Limit Configuration — every configured limit + reported utilization (values supplied). */
export function LimitConfiguration() {
  const { data, isLoading, isError, refetch } = useLimitConfiguration();
  if (isLoading) return <RiskLoading />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <RiskEmpty label="No limits configured." />;

  return (
    <InfoCard title="Limit configuration">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Limit</th>
              <th className="px-3 py-1.5 text-left font-medium">Scope</th>
              <th className="px-3 py-1.5 text-left font-medium">Assessment</th>
              <th className="px-3 py-1.5 text-right font-medium">Bound</th>
              <th className="px-3 py-1.5 text-right font-medium">Utilization</th>
              <th className="px-3 py-1.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((limit) => (
              <tr key={`${limit.assessmentId}-${limit.id}`} className="border-t">
                <td className="px-3 py-1.5 font-medium">{limit.label}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{limit.scope}</td>
                <td className="px-3 py-1.5">
                  <Link href={`/risk-engine/${limit.assessmentId}`} className="hover:underline">
                    {limit.assessmentName}
                  </Link>
                </td>
                <td className="px-3 py-1.5 text-right font-mono">{limit.bound}</td>
                <td className="px-3 py-1.5 text-right font-mono">{limit.utilization}</td>
                <td className="px-3 py-1.5 text-right">
                  <StatusBadge label={limit.status.label} tone={limit.status.tone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Bounds are configured here; utilization is reported by the risk model — never computed by
        this console.
      </p>
    </InfoCard>
  );
}
