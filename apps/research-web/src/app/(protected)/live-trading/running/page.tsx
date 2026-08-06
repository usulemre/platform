import type { Metadata } from 'next';
import { ProductionOrders, RunningStrategies } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Running strategies · Research Platform' };

/** Running Strategies + Production Orders page. */
export default function RunningStrategiesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Running strategies</h1>
        <p className="max-w-prose text-muted-foreground">
          Deployments actively trading and their production orders. Runs execute through the broker
          gateway abstraction; this console surfaces state, never executes.
        </p>
      </div>
      <RunningStrategies />
      <ProductionOrders />
    </div>
  );
}
