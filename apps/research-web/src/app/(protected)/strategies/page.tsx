import type { Metadata } from 'next';
import { StrategyDashboard, StrategiesView } from '@/modules/strategy';

export const metadata: Metadata = {
  title: 'Strategies · Research Platform',
};

/** Strategy Dashboard + Catalog page (Server Component). Interactive parts are
 *  Client Components that fetch through the application service. */
export default function StrategiesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Strategies</h1>
        <p className="max-w-prose text-muted-foreground">
          Investment strategies composed from approved signals. Read-only presentation — strategies
          are advisory until approved for portfolio construction through governed workflows.
        </p>
      </div>
      <StrategyDashboard />
      <StrategiesView />
    </div>
  );
}
