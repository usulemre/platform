import type { Metadata } from 'next';
import Link from 'next/link';
import { TradingDashboard, DeploymentRegistry } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Live trading · Research Platform' };

/** Live Trading Platform — Dashboard + Deployment registry (Server Component). The
 *  interactive parts are Client Components that fetch through the application service. */
export default function LiveTradingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Live trading</h1>
          <p className="max-w-prose text-muted-foreground">
            The production trading platform that promotes validated, paper-traded strategies into
            governed production through broker abstractions. Default posture is paper/shadow; live
            requires a valid authorization token, and the kill switch is always available to
            authorized humans.
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
            href="/live-trading/portfolio"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Portfolio
          </Link>
          <Link
            href="/live-trading/history"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            History
          </Link>
        </nav>
      </div>
      <TradingDashboard />
      <DeploymentRegistry />
    </div>
  );
}
