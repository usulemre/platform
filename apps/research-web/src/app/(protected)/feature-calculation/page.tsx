import type { Metadata } from 'next';
import Link from 'next/link';
import { FeatureCalculationDashboard } from '@/modules/feature-calculation';

export const metadata: Metadata = { title: 'Feature calculation · Research Platform' };

/** Feature Calculation Engine — Dashboard (Server Component). The interactive parts are Client
 *  Components that run the real calculation SDK through the application service. */
export default function FeatureCalculationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Feature calculation</h1>
          <p className="max-w-prose text-muted-foreground">
            The production computation engine that calculates quantitative features from canonical
            market datasets — real, deterministic, point-in-time algorithms (SMA, EMA, RSI, MACD,
            Bollinger Bands, VWAP, …) consumed by signals, backtesting and portfolio construction.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Feature calculation sections">
          <Link
            href="/feature-calculation/explorer"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Explorer
          </Link>
          <Link
            href="/feature-calculation/benchmark"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Benchmark
          </Link>
          <Link
            href="/feature-calculation/history"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            History
          </Link>
          <Link
            href="/feature-calculation/metrics"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Metrics
          </Link>
        </nav>
      </div>
      <FeatureCalculationDashboard />
    </div>
  );
}
