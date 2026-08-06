'use client';

import { useVenueComparison } from '../hooks/use-tca';
import { InfoCard, TcaLoading } from './tca-atoms';
import { VenueTable } from './tca-tables';

/** Venue Comparison — notional-weighted execution cost and quality per venue, best cost first. */
export function VenueComparison() {
  const { data, isLoading } = useVenueComparison();
  if (isLoading || !data) return <TcaLoading rows={6} />;
  return (
    <div className="space-y-4">
      <InfoCard title="Execution cost by venue">
        <p className="mb-3 text-sm text-muted-foreground">
          Costs are notional-weighted across every execution routed to the venue and sorted with the
          cheapest venue first. Broker-independent — venues are reference labels, not connections.
        </p>
        <VenueTable rows={data} />
      </InfoCard>
    </div>
  );
}
