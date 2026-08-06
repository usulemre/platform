import type { Metadata } from 'next';
import Link from 'next/link';
import { TradingDashboard, DeploymentRegistry } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Live Trading · Admin' };

/** Live Trading Platform (admin) — Dashboard + Deployment registry (Server Component). */
export default function LiveTradingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Live Trading</h1>
          <p className="max-w-prose text-muted-foreground">
            The production trading platform. Administer trading accounts, broker/exchange connection
            abstractions, deployment approvals, emergency controls and the kill switch, and audit
            every governed action — never contacting an exchange or broker.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Live trading sections">
          <Link
            href="/live-trading/accounts"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Accounts
          </Link>
          <Link
            href="/live-trading/connections"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Connections
          </Link>
          <Link
            href="/live-trading/approvals"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Approvals
          </Link>
          <Link
            href="/live-trading/emergency"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Emergency
          </Link>
          <Link
            href="/live-trading/audit"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Audit
          </Link>
        </nav>
      </div>
      <TradingDashboard />
      <DeploymentRegistry />
    </div>
  );
}
