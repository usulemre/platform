import type { Metadata } from 'next';
import Link from 'next/link';
import { ExecutionDashboard, SessionRegistry } from '@/modules/execution-simulator';

export const metadata: Metadata = { title: 'Execution Simulator · Admin' };

/** Execution Simulator (admin) — Dashboard + Sessions registry (Server Component). */
export default function ExecutionSimulatorPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Execution Simulator</h1>
          <p className="max-w-prose text-muted-foreground">
            The paper-trading and execution-simulation platform. Administer scenario templates,
            review and approve simulation sessions, and compare execution quality — never contacting
            an exchange or broker.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Execution simulator sections">
          <Link
            href="/execution-simulator/review"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Review
          </Link>
          <Link
            href="/execution-simulator/templates"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Templates
          </Link>
          <Link
            href="/execution-simulator/comparisons"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Comparisons
          </Link>
        </nav>
      </div>
      <ExecutionDashboard />
      <SessionRegistry />
    </div>
  );
}
