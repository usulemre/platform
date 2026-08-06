'use client';

import Link from 'next/link';
import { useRiskPolicies, useRuleExplorer } from '../hooks/use-risk-engine';
import { RiskEmpty, RiskError, RiskLoading, InfoCard, StatusBadge } from './risk-engine-atoms';

/** Risk Policies — the registry of applied risk policies. */
export function RiskPolicies() {
  const { data, isLoading, isError, refetch } = useRiskPolicies();
  if (isLoading) return <RiskLoading rows={3} />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <RiskEmpty label="No policies configured." />;

  return (
    <InfoCard title="Policies">
      <ul className="space-y-1 text-sm">
        {data.map((policy) => (
          <li key={policy.id} className="flex items-start justify-between gap-4 border-b py-1.5">
            <span>
              <span className="flex items-center gap-2">
                <StatusBadge label={policy.category} tone="info" />
                <span className="font-medium">{policy.name}</span>
                <span className="text-xs text-muted-foreground">v{policy.version}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{policy.ref}</span>
              </span>
              <p className="text-xs text-muted-foreground">{policy.description}</p>
            </span>
            <StatusBadge label={policy.status.label} tone={policy.status.tone} />
          </li>
        ))}
      </ul>
    </InfoCard>
  );
}

/** Risk Rule Explorer — every evaluated rule across the registry (verdicts decided elsewhere). */
export function RuleExplorer() {
  const { data, isLoading, isError, refetch } = useRuleExplorer();
  if (isLoading) return <RiskLoading />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <RiskEmpty label="No rules." />;

  return (
    <InfoCard title="Rule explorer">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Rule</th>
              <th className="px-3 py-1.5 text-left font-medium">Expression</th>
              <th className="px-3 py-1.5 text-left font-medium">Assessment</th>
              <th className="px-3 py-1.5 text-right font-medium">Severity</th>
              <th className="px-3 py-1.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((rule) => (
              <tr key={`${rule.assessmentId}-${rule.id}`} className="border-t">
                <td className="px-3 py-1.5">
                  <span className="font-mono text-xs text-muted-foreground">{rule.code}</span>{' '}
                  <span className="font-medium">{rule.label}</span>
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                  {rule.expression}
                </td>
                <td className="px-3 py-1.5">
                  <Link href={`/risk-engine/${rule.assessmentId}`} className="hover:underline">
                    {rule.assessmentName}
                  </Link>
                </td>
                <td className="px-3 py-1.5 text-right text-muted-foreground">{rule.severity}</td>
                <td className="px-3 py-1.5 text-right">
                  <StatusBadge label={rule.status.label} tone={rule.status.tone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Rule evaluation is performed by deterministic engines; statuses are reflected here, never
        decided.
      </p>
    </InfoCard>
  );
}
