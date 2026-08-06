import type { Metadata } from 'next';
import Link from 'next/link';
import { PortfolioOptimizationDashboard } from '@/modules/portfolio-optimization';

export const metadata: Metadata = { title: 'Portfolio optimization · Research Platform' };

/** Portfolio Optimization Engine — Dashboard (Server Component). The interactive parts are Client
 *  Components that run the real portfolio-optimization SDK through the application service. */
export default function PortfolioOptimizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Portfolio optimization</h1>
          <p className="max-w-prose text-muted-foreground">
            The production computation engine that constructs optimal portfolios from estimated
            returns and risk — real, deterministic optimization (minimum variance, mean-variance,
            maximum Sharpe, risk parity, …) under real constraints, consumed by backtesting, paper
            trading and live trading.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Portfolio optimization sections">
          <Link
            href="/portfolio-optimization/constraints"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Constraints
          </Link>
          <Link
            href="/portfolio-optimization/allocation"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Allocation
          </Link>
          <Link
            href="/portfolio-optimization/frontier"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Frontier
          </Link>
          <Link
            href="/portfolio-optimization/comparison"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Comparison
          </Link>
          <Link
            href="/portfolio-optimization/history"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            History
          </Link>
        </nav>
      </div>
      <PortfolioOptimizationDashboard />
    </div>
  );
}
