import type { Metadata } from 'next';
import Link from 'next/link';
import { SignalEngineDashboard, SignalCatalog } from '@/modules/signal-engine';

export const metadata: Metadata = { title: 'Signal engine · Research Platform' };

/** Signal Engine — Dashboard + Registry Explorer/Catalog (Server Component). The
 *  interactive parts are Client Components that fetch through the application
 *  service. */
export default function SignalEnginePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Signal engine</h1>
          <p className="max-w-prose text-muted-foreground">
            The orchestration layer for the trading-signal lifecycle — transforming approved
            features into validated signal definitions through a governed workflow from candidate to
            production candidate.
          </p>
        </div>
        <nav className="flex gap-2 text-sm" aria-label="Signal engine sections">
          <Link
            href="/signal-engine/queues"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Queues
          </Link>
          <Link
            href="/signal-engine/families"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Families
          </Link>
          <Link href="/signals" className="rounded-md border px-3 py-1.5 hover:bg-accent">
            Signal registry
          </Link>
        </nav>
      </div>
      <SignalEngineDashboard />
      <SignalCatalog />
    </div>
  );
}
