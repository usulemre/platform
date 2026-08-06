import type { Metadata } from 'next';
import { ExecutionDashboard, ExecutionsView } from '@/modules/execution';

export const metadata: Metadata = {
  title: 'Execution · Research Platform',
};

/** Execution Dashboard + Queue page (Server Component). Interactive parts are
 *  Client Components that fetch through the application service. */
export default function ExecutionPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Execution</h1>
        <p className="max-w-prose text-muted-foreground">
          Governed execution requests and their lifecycle. Read-only orchestration — this console
          never connects to brokers or exchanges; execution is paper-first and token-gated.
        </p>
      </div>
      <ExecutionDashboard />
      <ExecutionsView />
    </div>
  );
}
