import type { Metadata } from 'next';
import { SignalDashboard, SignalsView } from '@/modules/signal';

export const metadata: Metadata = {
  title: 'Signals · Research Platform',
};

/** Signal Dashboard + Catalog page (Server Component). Interactive parts are
 *  Client Components that fetch through the application service. */
export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Signals</h1>
        <p className="max-w-prose text-muted-foreground">
          Advisory research signals derived from approved features and validated research. Read-only
          presentation — signals never execute; execution is token-gated by Execution Governance.
        </p>
      </div>
      <SignalDashboard />
      <SignalsView />
    </div>
  );
}
