import type { Metadata } from 'next';
import Link from 'next/link';
import { ExecutionDashboard } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution · Admin' };

/** Execution Dashboard page (Server Component). The sections are Client Components that read the
 *  Execution Engine through the application service. */
export default function ExecutionHomePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Execution</h1>
          <p className="max-w-prose text-muted-foreground">
            The Execution Engine — it receives approved orders from the OMS and determines how they
            execute under execution policies. Plan, validate, queue and orchestrate the execution
            lifecycle across the queue, planner, policies, sessions, timeline, replay, metrics and
            health. It is broker-independent.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Execution sections">
          <Link href="/execution/queue" className="rounded-md border px-3 py-1.5 hover:bg-accent">
            Queue
          </Link>
          <Link href="/execution/planner" className="rounded-md border px-3 py-1.5 hover:bg-accent">
            Planner
          </Link>
          <Link
            href="/execution/policies"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Policies
          </Link>
          <Link href="/execution/history" className="rounded-md border px-3 py-1.5 hover:bg-accent">
            History
          </Link>
        </nav>
      </div>
      <ExecutionDashboard />
    </div>
  );
}
