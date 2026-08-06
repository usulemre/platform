import type { Metadata } from 'next';
import Link from 'next/link';
import { SmartRoutingDashboard } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Smart order router · Admin' };

/** Smart Routing Dashboard page (Server Component). The sections are Client Components that read the
 *  Smart Order Router through the application service. */
export default function SmartOrderRouterHomePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Smart order router</h1>
          <p className="max-w-prose text-muted-foreground">
            The Smart Order Router — it receives routing requests from the Execution Engine and
            determines the optimal venue under configurable routing policies. Explore venues,
            preview routing rules, review decisions, policies, timeline, replay, metrics and health.
            It is broker-independent.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="SOR sections">
          <Link
            href="/smart-order-router/venues"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Venues
          </Link>
          <Link
            href="/smart-order-router/rules"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Rules
          </Link>
          <Link
            href="/smart-order-router/decisions"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Decisions
          </Link>
          <Link
            href="/smart-order-router/history"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            History
          </Link>
        </nav>
      </div>
      <SmartRoutingDashboard />
    </div>
  );
}
