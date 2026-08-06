import type { Metadata } from 'next';
import Link from 'next/link';
import { SignalCalculationDashboard } from '@/modules/signal-calculation';

export const metadata: Metadata = { title: 'Signal calculation · Research Platform' };

/** Signal Calculation Engine — Dashboard (Server Component). The interactive parts are Client
 *  Components that run the real signal-calculation SDK through the application service. */
export default function SignalCalculationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Signal calculation</h1>
          <p className="max-w-prose text-muted-foreground">
            The production computation engine that transforms quantitative features into
            standardized trading signals — real, deterministic, point-in-time generators
            (crossovers, RSI/z-score thresholds, breakouts, filters, composites) consumed by
            backtesting, portfolio construction and execution.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Signal calculation sections">
          <Link
            href="/signal-calculation/explorer"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Explorer
          </Link>
          <Link
            href="/signal-calculation/debugger"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Debugger
          </Link>
          <Link
            href="/signal-calculation/benchmark"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Benchmark
          </Link>
          <Link
            href="/signal-calculation/comparison"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Comparison
          </Link>
          <Link
            href="/signal-calculation/timeline"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Timeline
          </Link>
          <Link
            href="/signal-calculation/overview"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Overview
          </Link>
        </nav>
      </div>
      <SignalCalculationDashboard />
    </div>
  );
}
