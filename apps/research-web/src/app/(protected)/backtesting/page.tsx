import type { Metadata } from 'next';
import Link from 'next/link';
import { BacktestingDashboard, BacktestRegistry } from '@/modules/backtesting';

export const metadata: Metadata = { title: 'Backtesting · Research Platform' };

/** Backtesting Engine — Dashboard + Registry (Server Component). The interactive
 *  parts are Client Components that fetch through the application service. */
export default function BacktestingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Backtesting</h1>
          <p className="max-w-prose text-muted-foreground">
            The orchestration platform for quantitative strategy evaluation — managing backtesting
            projects and coordinating historical simulations over approved datasets, features,
            signals and strategies.
          </p>
        </div>
        <nav className="flex gap-2 text-sm" aria-label="Backtesting sections">
          <Link href="/backtesting/queue" className="rounded-md border px-3 py-1.5 hover:bg-accent">
            Queue
          </Link>
          <Link
            href="/backtesting/comparisons"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Comparisons
          </Link>
          <Link
            href="/backtesting/families"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Families
          </Link>
        </nav>
      </div>
      <BacktestingDashboard />
      <BacktestRegistry />
    </div>
  );
}
