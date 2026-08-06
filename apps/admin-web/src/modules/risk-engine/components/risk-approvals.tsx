'use client';

import Link from 'next/link';
import { useApprovalQueue, useExceptions, useOverrides } from '../hooks/use-risk-engine';
import type { QueueItemVm } from '../domain/view-model';
import { RiskEmpty, RiskError, RiskLoading, InfoCard, StatusBadge } from './risk-engine-atoms';

function QueueList({ items, emptyLabel }: { items: readonly QueueItemVm[]; emptyLabel: string }) {
  if (items.length === 0) return <RiskEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
        >
          <span className="min-w-0">
            <Link href={`/risk-engine/${item.id}`} className="font-medium hover:underline">
              {item.name}
            </Link>
            <span className="ml-2 text-xs text-muted-foreground">
              {item.namespace} / {item.family} · {item.subjectName} · {item.owner}
            </span>
          </span>
          <StatusBadge label={item.primaryStatus.label} tone={item.primaryStatus.tone} />
        </li>
      ))}
    </ul>
  );
}

/** Risk Approval Queue (admin) — assessments awaiting a governance approval decision. */
export function ApprovalQueue() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  if (isLoading) return <RiskLoading rows={3} />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Approval queue">
      <QueueList items={data ?? []} emptyLabel="No assessments awaiting approval." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Approval is a governance decision by accountable humans — surfaced here, never made by this
        console.
      </p>
    </InfoCard>
  );
}

/** Risk Exceptions (admin) — every exception across the registry. */
export function Exceptions() {
  const { data, isLoading, isError, refetch } = useExceptions();
  if (isLoading) return <RiskLoading rows={3} />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Exceptions">
      {!data || data.length === 0 ? (
        <RiskEmpty label="No exceptions raised." />
      ) : (
        <ul className="space-y-1 text-sm">
          {data.map((exception) => (
            <li
              key={`${exception.assessmentId}-${exception.id}`}
              className="flex items-start justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-mono text-xs text-muted-foreground">{exception.code}</span>{' '}
                <span className="font-medium">{exception.reason}</span>
                <p className="text-xs text-muted-foreground">
                  <Link href={`/risk-engine/${exception.assessmentId}`} className="hover:underline">
                    {exception.assessmentName}
                  </Link>
                  {' · '}by {exception.raisedBy} · {exception.raisedLabel}
                  {exception.expiresLabel ? ` · expires ${exception.expiresLabel}` : ''}
                </p>
              </span>
              <StatusBadge label={exception.status.label} tone={exception.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Exception disposition is a governance decision — recorded here, never made by this console.
      </p>
    </InfoCard>
  );
}

/** Risk Overrides (admin) — every override across the registry. */
export function Overrides() {
  const { data, isLoading, isError, refetch } = useOverrides();
  if (isLoading) return <RiskLoading rows={3} />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Overrides">
      {!data || data.length === 0 ? (
        <RiskEmpty label="No overrides recorded." />
      ) : (
        <ul className="space-y-1 text-sm">
          {data.map((override) => (
            <li
              key={`${override.assessmentId}-${override.id}`}
              className="flex items-start justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-medium">{override.reason}</span>
                <p className="text-xs text-muted-foreground">
                  <Link href={`/risk-engine/${override.assessmentId}`} className="hover:underline">
                    {override.assessmentName}
                  </Link>
                  {' · '}by {override.authorizedBy} · counter-signed {override.counterSignedBy} ·{' '}
                  {override.grantedLabel}
                  {override.expiresLabel ? ` · expires ${override.expiresLabel}` : ''}
                </p>
              </span>
              <StatusBadge label={override.status.label} tone={override.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Overrides are time-boxed and counter-signed by authorized humans — recorded here, never
        auto-applied.
      </p>
    </InfoCard>
  );
}

/** Combined admin approvals view (approval queue + exceptions + overrides). */
export function RiskApprovals() {
  return (
    <div className="space-y-6">
      <ApprovalQueue />
      <div className="grid gap-6 lg:grid-cols-2">
        <Exceptions />
        <Overrides />
      </div>
    </div>
  );
}
