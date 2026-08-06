import type { Metadata } from 'next';
import { ExperimentDashboard, ExperimentsView } from '@/modules/experiment';

export const metadata: Metadata = {
  title: 'Experiments · Research Platform',
};

/** Experiment Dashboard + List page (Server Component). Interactive parts are
 *  Client Components that fetch through the application service. */
export default function ExperimentsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Experiments</h1>
        <p className="max-w-prose text-muted-foreground">
          Registered research experiments. Read-only presentation — registration, pre-registration
          and lifecycle transitions occur through governed workflows, never from this console.
        </p>
      </div>
      <ExperimentDashboard />
      <ExperimentsView />
    </div>
  );
}
