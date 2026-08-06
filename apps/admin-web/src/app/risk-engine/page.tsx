import type { Metadata } from 'next';
import Link from 'next/link';
import { RiskDashboard, RiskRegistry } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Risk Engine · Admin' };

/** Risk Engine (admin) — Dashboard + Registry (Server Component). The interactive parts
 *  are Client Components that fetch through the application service. */
export default function RiskEnginePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Risk Engine</h1>
          <p className="max-w-prose text-muted-foreground">
            The governance and orchestration platform that validates portfolios before execution.
            Administer risk policies, limits, exceptions, overrides and the approval workflow, and
            audit every governance event.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Risk engine sections">
          <Link
            href="/risk-engine/policies"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Policies
          </Link>
          <Link
            href="/risk-engine/limits"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Limits
          </Link>
          <Link
            href="/risk-engine/approvals"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Approvals
          </Link>
          <Link href="/risk-engine/audit" className="rounded-md border px-3 py-1.5 hover:bg-accent">
            Audit
          </Link>
        </nav>
      </div>
      <RiskDashboard />
      <RiskRegistry />
    </div>
  );
}
