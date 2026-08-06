import type { Metadata } from 'next';
import Link from 'next/link';
import { RiskDashboard, RiskRegistry } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Risk engine · Research Platform' };

/** Risk Engine — Dashboard + Registry (Server Component). The interactive parts are
 *  Client Components that fetch through the application service. */
export default function RiskEnginePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Risk engine</h1>
          <p className="max-w-prose text-muted-foreground">
            The governance and orchestration platform that validates portfolios before execution —
            coordinating institutional risk reviews, policy enforcement, exposure validation and
            approval workflows over constructed portfolios.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Risk engine sections">
          <Link
            href="/risk-engine/review"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Review &amp; validation
          </Link>
          <Link
            href="/risk-engine/exposures"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Exposures
          </Link>
          <Link
            href="/risk-engine/reports"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Reports
          </Link>
        </nav>
      </div>
      <RiskDashboard />
      <RiskRegistry />
    </div>
  );
}
