'use client';

import { usePolicies, useVenues } from '../hooks/use-execution';
import { ExecError, ExecLoading, InfoCard, StatusBadge } from './execution-atoms';

/** Execution Policies — the policy catalog and the venue abstractions. */
export function ExecutionPolicies() {
  const policies = usePolicies();
  const venues = useVenues();
  if (policies.isLoading || venues.isLoading) return <ExecLoading />;
  if (policies.isError) return <ExecError onRetry={() => policies.refetch()} />;
  return (
    <div className="space-y-4">
      <InfoCard
        title="Policy framework"
        action={
          <span className="text-xs text-muted-foreground">
            {policies.data?.length ?? 0} policies
          </span>
        }
      >
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Policy</th>
                <th className="px-3 py-1.5 text-left font-medium">Category</th>
                <th className="px-3 py-1.5 text-left font-medium">Description</th>
                <th className="px-3 py-1.5 text-left font-medium">Parameters</th>
              </tr>
            </thead>
            <tbody>
              {(policies.data ?? []).map((policy) => (
                <tr key={policy.type} className="border-t">
                  <td className="px-3 py-1 font-medium">{policy.label}</td>
                  <td className="px-3 py-1">
                    <StatusBadge label={policy.category} tone="neutral" />
                  </td>
                  <td className="px-3 py-1 text-muted-foreground">{policy.description}</td>
                  <td className="px-3 py-1 text-xs text-muted-foreground">
                    {policy.params.length === 0
                      ? '—'
                      : policy.params
                          .map((p) => `${p.name} (${p.defaultValue}${p.unit})`)
                          .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoCard>

      <InfoCard title="Execution venues (abstractions)">
        <ul className="space-y-1 text-sm">
          {(venues.data ?? []).map((venue) => (
            <li key={venue.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{venue.label}</span>{' '}
                <span className="text-xs text-muted-foreground">{venue.description}</span>
              </span>
              <StatusBadge label={venue.mode.label} tone={venue.mode.tone} />
            </li>
          ))}
        </ul>
        <p role="note" className="mt-2 text-xs text-muted-foreground">
          Venues are abstractions routed to downstream (Execution Simulator / Live Trading
          Platform); the engine never contacts a broker or exchange.
        </p>
      </InfoCard>
    </div>
  );
}
