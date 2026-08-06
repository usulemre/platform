'use client';

import Link from 'next/link';
import { useExecution } from '../hooks/use-execution';
import type { ExecutionDetailVm } from '../domain/view-model';
import { ExecError, ExecLoading, InfoCard, ProgressBar, StatusBadge } from './execution-atoms';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-medium">{value}</p>
    </div>
  );
}

function DetailBody({ execution }: { execution: ExecutionDetailVm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{execution.clientOrderId}</h2>
        <span className="text-muted-foreground">{execution.symbol}</span>
        <StatusBadge label={execution.side.label} tone={execution.side.tone} />
        <StatusBadge label={execution.status.label} tone={execution.status.tone} />
        <StatusBadge label={execution.mode.label} tone={execution.mode.tone} />
        {execution.paused ? <StatusBadge label="Paused" tone="warning" /> : null}
        <span className="text-xs text-muted-foreground">
          order {execution.orderId} · updated {execution.updatedLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Quantity" value={execution.quantity} />
        <Field label="Executed" value={`${execution.executed} (${execution.progressLabel})`} />
        <Field label="Remaining" value={execution.remaining} />
        <Field label="Avg price" value={execution.avgPrice} />
        <Field label="Validation" value={execution.validation.label} />
        <Field label="Tasks" value={String(execution.tasks.length)} />
      </div>
      <div>
        <ProgressBar percent={execution.progressPercent} />
      </div>

      {execution.plan ? (
        <InfoCard title={`Execution plan — ${execution.plan.strategy}`}>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Venue: <span className="font-medium">{execution.plan.venue}</span>
            </span>
            <span>
              Slices: {execution.plan.sliceCount} × {execution.plan.sliceQuantity}
            </span>
            <span>Priority: {execution.plan.priority}</span>
            <span>Retry: {execution.plan.retryLimit}</span>
            <span>Timeout: {execution.plan.timeoutSeconds}s</span>
            {execution.plan.releaseLabel ? (
              <span>Release: {execution.plan.releaseLabel}</span>
            ) : null}
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {execution.plan.evaluations.map((evaluation) => (
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
          action={
            <StatusBadge label={execution.validation.label} tone={execution.validation.tone} />
          }
        >
          <ul className="space-y-1 text-sm">
            {execution.validationChecks.map((check) => (
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
            {execution.actions.map((action) => (
              <StatusBadge
                key={action.action}
                label={action.label}
                tone={action.permitted ? 'positive' : 'neutral'}
              />
            ))}
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Permitted actions are computed by the state machine from the status and pause flag. This
            console is read-only.
          </p>
        </InfoCard>
      </div>

      {execution.slices.length > 0 ? (
        <InfoCard title="Slice executions">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                  <th className="px-3 py-1.5 text-right font-medium">Price</th>
                  <th className="px-3 py-1.5 text-left font-medium">Venue</th>
                  <th className="px-3 py-1.5 text-left font-medium">At</th>
                </tr>
              </thead>
              <tbody>
                {execution.slices.map((slice) => (
                  <tr key={slice.taskId} className="border-t">
                    <td className="px-3 py-1 text-right font-mono">{slice.quantity}</td>
                    <td className="px-3 py-1 text-right font-mono">{slice.price}</td>
                    <td className="px-3 py-1 text-muted-foreground">{slice.venue}</td>
                    <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                      {slice.atLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Lifecycle timeline">
          <ul className="space-y-1 text-sm">
            {execution.events.map((event) => (
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
            {execution.audit.map((entry) => (
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

      <InfoCard title="Policies & metadata">
        <div className="mb-2 flex flex-wrap gap-2">
          {execution.policies.map((policy) => (
            <span key={policy.type} className="rounded-md border px-2 py-1 text-xs">
              {policy.label}
              {policy.params !== '—' ? ` (${policy.params})` : ''}
            </span>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          {execution.metadata.map((row) => (
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

/** Execution detail — the full lifecycle view for a single execution. */
export function ExecutionDetailView({ executionId }: { executionId: string }) {
  const { data, isLoading, isError, refetch } = useExecution(executionId);
  if (isLoading) return <ExecLoading />;
  if (isError) return <ExecError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Execution not found.</p>
        <Link href="/execution/history" className="text-sm underline-offset-2 hover:underline">
          Back to history
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Link
        href="/execution/history"
        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
      >
        ← History
      </Link>
      <DetailBody execution={data} />
    </div>
  );
}
