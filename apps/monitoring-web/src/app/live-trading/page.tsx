import type { Metadata } from 'next';
import Link from 'next/link';
import { TradingDashboard, RunningStrategies } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Live Trading · Monitoring' };

/** Live Trading Platform (monitoring) — read-only production visibility (Server Component). */
export default function LiveTradingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Live Trading</h1>
          <p className="max-w-prose text-muted-foreground">
            Read-only production visibility into running strategies, health, metrics, timeline and
            emergency status. It consumes operational data exposed by the platform — it never
            decides and never executes.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Live trading sections">
          <Link
            href="/live-trading/running"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Running
          </Link>
          <Link
            href="/live-trading/health"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Health
          </Link>
          <Link
            href="/live-trading/metrics"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Metrics
          </Link>
          <Link
            href="/live-trading/timeline"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Timeline
          </Link>
          <Link
            href="/live-trading/emergency"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Emergency
          </Link>
        </nav>
      </div>
      <TradingDashboard />
      <RunningStrategies />
    </div>
  );
}
