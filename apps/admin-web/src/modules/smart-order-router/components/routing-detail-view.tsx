'use client';

import Link from 'next/link';
import { useRouting } from '../hooks/use-sor';
import type { RoutingDetailVm } from '../domain/view-model';
import { InfoCard, SorError, SorLoading, StatusBadge } from './sor-atoms';
import { RankedVenueTable } from './routing-rules';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-medium">{value}</p>
    </div>
  );
}

function DetailBody({ routing }: { routing: RoutingDetailVm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{routing.clientOrderId}</h2>
        <span className="text-muted-foreground">{routing.symbol}</span>
        <StatusBadge label={routing.side.label} tone={routing.side.tone} />
        <StatusBadge label={routing.status.label} tone={routing.status.tone} />
        <StatusBadge label={routing.mode.label} tone={routing.mode.tone} />
        <span className="text-xs text-muted-foreground">
          execution {routing.executionId} · updated {routing.updatedLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Quantity" value={routing.quantity} />
        <Field label="Asset class" value={routing.assetClass} />
        <Field label="Selected venue" value={routing.decision?.selectedVenue ?? '—'} />
        <Field label="Fallback" value={routing.decision?.fallbackVenue ?? '—'} />
        <Field label="Validation" value={routing.validation.label} />
        <Field label="Attempts" value={String(routing.attempts)} />
      </div>

      {routing.decision ? (
        <InfoCard
          title={`Decision — ${routing.decision.policyType} (${routing.decision.strategy})`}
        >
          <p className="text-sm text-muted-foreground">{routing.decision.reason}</p>
          <div className="mt-2">
            <RankedVenueTable ranked={routing.decision.ranked} />
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {routing.decision.evaluations.map((evaluation) => (
              <li
                key={evaluation.type}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                <span>
                  <span className="font-medium">{evaluation.type}</span>{' '}
                  <span className="text-xs text-muted-foreground">{evaluation.detail}</span>
                </span>
                <StatusBadge
                  label={evaluation.allow ? evaluation.decision : 'blocked'}
                  tone={evaluation.allow ? 'positive' : 'danger'}
                />
              </li>
            ))}
          </ul>
        </InfoCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          title="Validation"
          action={<StatusBadge label={routing.validation.label} tone={routing.validation.tone} />}
        >
          <ul className="space-y-1 text-sm">
            {routing.validationChecks.map((check) => (
              <li key={check.id} className="flex items-center justify-between gap-4 border-b py-1">
                <span>
                  <span className="font-medium">{check.label}</span>{' '}
                  <span className="text-xs text-muted-foreground">{check.detail}</span>
                </span>
                <StatusBadge label={check.status.label} tone={check.status.tone} />
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="Permitted actions">
          <div className="flex flex-wrap gap-2">
            {routing.actions.map((action) => (
              <StatusBadge
                key={action.action}
                label={action.label}
                tone={action.permitted ? 'positive' : 'neutral'}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Candidates: {routing.candidateVenueIds.join(', ') || '—'}
            {routing.blacklistedVenueIds.length > 0
              ? ` · blacklisted: ${routing.blacklistedVenueIds.join(', ')}`
              : ''}
          </p>
          <p role="note" className="mt-1 text-xs text-muted-foreground">
            Actions are computed by the state machine from the status. This console is read-only.
          </p>
        </InfoCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Lifecycle timeline">
          <ul className="space-y-1 text-sm">
            {routing.events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 border-b py-1">
                <span className="flex items-center gap-2">
                  <StatusBadge label={event.type} tone={event.tone} />
                  <span className="text-xs text-muted-foreground">{event.message}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">{event.atLabel}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="Audit trail">
          <ul className="space-y-1 text-sm">
            {routing.audit.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 border-b py-1">
                <span>
                  <span className="font-medium">{entry.action}</span>{' '}
                  <span className="text-xs text-muted-foreground">
                    {entry.actor} · {entry.detail}
                  </span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">{entry.atLabel}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>

      <InfoCard title="Metadata">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          {routing.metadata.map((row) => (
            <div key={row.label} className="flex justify-between gap-2 border-b py-1">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </InfoCard>
    </div>
  );
}

/** Routing detail — the full lifecycle view for a single routing. */
export function RoutingDetailView({ routingId }: { routingId: string }) {
  const { data, isLoading, isError, refetch } = useRouting(routingId);
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Routing not found.</p>
        <Link
          href="/smart-order-router/history"
          className="text-sm underline-offset-2 hover:underline"
        >
          Back to history
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Link
        href="/smart-order-router/history"
        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
      >
        ← History
      </Link>
      <DetailBody routing={data} />
    </div>
  );
}
