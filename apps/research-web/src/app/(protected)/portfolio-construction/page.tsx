import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PortfolioConstructionDashboard,
  PortfolioRegistry,
} from '@/modules/portfolio-construction';

export const metadata: Metadata = { title: 'Portfolio construction · Research Platform' };

/** Portfolio Construction Engine — Dashboard + Registry (Server Component). The
 *  interactive parts are Client Components that fetch through the application service. */
export default function PortfolioConstructionPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Portfolio construction</h1>
          <p className="max-w-prose text-muted-foreground">
            The orchestration platform that transforms approved trading signals into governed
            investment portfolios — managing portfolio definitions and coordinating construction
            workflows over approved signals, strategies and backtests.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Portfolio construction sections">
          <Link
            href="/portfolio-construction/builder"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Builder
          </Link>
          <Link
            href="/portfolio-construction/optimization"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Optimization
          </Link>
          <Link
            href="/portfolio-construction/comparisons"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Comparisons
          </Link>
          <Link
            href="/portfolio-construction/families"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Families
          </Link>
        </nav>
      </div>
      <PortfolioConstructionDashboard />
      <PortfolioRegistry />
    </div>
  );
}
