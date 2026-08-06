'use client';

import { usePolicies, useVenueHealth, useVenueTypes, useVenues } from '../hooks/use-sor';
import { InfoCard, SorError, SorLoading, StatusBadge } from './sor-atoms';

/** Venue Explorer — the canonical venue catalog with reference metrics. */
export function VenueExplorer() {
  const venues = useVenues();
  const types = useVenueTypes();
  if (venues.isLoading || types.isLoading) return <SorLoading />;
  if (venues.isError) return <SorError onRetry={() => venues.refetch()} />;
  return (
    <div className="space-y-4">
      <InfoCard
        title="Venues"
        action={
          <span className="text-xs text-muted-foreground">{venues.data?.length ?? 0} venues</span>
        }
      >
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Venue</th>
                <th className="px-3 py-1.5 text-left font-medium">Type</th>
                <th className="px-3 py-1.5 text-left font-medium">Status</th>
                <th className="px-3 py-1.5 text-right font-medium">Fee</th>
                <th className="px-3 py-1.5 text-right font-medium">Latency</th>
                <th className="px-3 py-1.5 text-right font-medium">Liquidity</th>
                <th className="px-3 py-1.5 text-right font-medium">Fill</th>
                <th className="px-3 py-1.5 text-left font-medium">Assets</th>
              </tr>
            </thead>
            <tbody>
              {(venues.data ?? []).map((venue) => (
                <tr key={venue.id} className="border-t">
                  <td className="px-3 py-1 font-medium">
                    {venue.name}{' '}
                    <span className="text-xs text-muted-foreground">{venue.region}</span>
                  </td>
                  <td className="px-3 py-1 text-xs text-muted-foreground">{venue.type}</td>
                  <td className="px-3 py-1">
                    <StatusBadge label={venue.status.label} tone={venue.status.tone} />
                  </td>
                  <td className="px-3 py-1 text-right font-mono">{venue.feeBps}</td>
                  <td className="px-3 py-1 text-right font-mono">{venue.latency}</td>
                  <td className="px-3 py-1 text-right font-mono">{venue.liquidity}</td>
                  <td className="px-3 py-1 text-right font-mono">{venue.fill}</td>
                  <td className="px-3 py-1 text-xs text-muted-foreground">
                    {venue.assetClasses.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoCard>
      <InfoCard title="Venue types">
        <ul className="space-y-1 text-sm">
          {(types.data ?? []).map((type) => (
            <li key={type.type} className="flex items-center justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{type.label}</span>{' '}
                <span className="text-xs text-muted-foreground">{type.description}</span>
              </span>
              {type.placeholder ? (
                <StatusBadge label="placeholder" tone="warning" />
              ) : (
                <StatusBadge label="supported" tone="positive" />
              )}
            </li>
          ))}
        </ul>
      </InfoCard>
    </div>
  );
}

/** Venue Health — per-venue availability and error rate. */
export function VenueHealth() {
  const { data, isLoading, isError, refetch } = useVenueHealth();
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Venue health">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Venue</th>
              <th className="px-3 py-1.5 text-left font-medium">Status</th>
              <th className="px-3 py-1.5 text-right font-medium">Uptime</th>
              <th className="px-3 py-1.5 text-right font-medium">Error rate</th>
              <th className="px-3 py-1.5 text-left font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((venue) => (
              <tr key={venue.venueId} className="border-t">
                <td className="px-3 py-1 font-medium">{venue.name}</td>
                <td className="px-3 py-1">
                  <StatusBadge label={venue.status.label} tone={venue.status.tone} />
                </td>
                <td className="px-3 py-1 text-right font-mono">{venue.uptime}</td>
                <td className="px-3 py-1 text-right font-mono">{venue.errorRate}</td>
                <td className="px-3 py-1 text-muted-foreground">{venue.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="note" className="mt-2 text-xs text-muted-foreground">
        Venue health is derived deterministically from the venue status; the router never probes or
        contacts a venue.
      </p>
    </InfoCard>
  );
}

/** Routing Policies — the policy catalog. */
export function RoutingPolicies() {
  const { data, isLoading, isError, refetch } = usePolicies();
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  return (
    <InfoCard
      title="Routing policy framework"
      action={<span className="text-xs text-muted-foreground">{data?.length ?? 0} policies</span>}
    >
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Policy</th>
              <th className="px-3 py-1.5 text-left font-medium">Category</th>
              <th className="px-3 py-1.5 text-left font-medium">Dimension</th>
              <th className="px-3 py-1.5 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((policy) => (
              <tr key={policy.type} className="border-t">
                <td className="px-3 py-1 font-medium">
                  {policy.label}
                  {policy.placeholder ? (
                    <span className="ml-1 text-[10px] uppercase text-amber-600">placeholder</span>
                  ) : null}
                </td>
                <td className="px-3 py-1">
                  <StatusBadge label={policy.category} tone="neutral" />
                </td>
                <td className="px-3 py-1 text-xs text-muted-foreground">{policy.dimension}</td>
                <td className="px-3 py-1 text-muted-foreground">{policy.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoCard>
  );
}
