import type { Metadata } from 'next';
import Link from 'next/link';
import { ExecutionDashboard, SessionRegistry } from '@/modules/execution-simulator';

export const metadata: Metadata = { title: 'Execution simulator · Research Platform' };

/** Execution Simulator — Dashboard + Sessions registry (Server Component). The
 *  interactive parts are Client Components that fetch through the application service. */
export default function ExecutionSimulatorPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Execution simulator</h1>
          <p className="max-w-prose text-muted-foreground">
            The paper-trading and execution-simulation platform. It validates execution workflows
            before any strategy is promoted to live trading — simulating order lifecycles, fills and
            portfolio state transitions without ever contacting an exchange or broker.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Execution simulator sections">
          <Link
            href="/execution-simulator/queue"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Queue
          </Link>
          <Link
            href="/execution-simulator/history"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            History
          </Link>
          <Link
            href="/execution-simulator/reports"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Reports
          </Link>
        </nav>
      </div>
      <ExecutionDashboard />
      <SessionRegistry />
    </div>
  );
}
