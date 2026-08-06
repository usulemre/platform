import type { Metadata } from 'next';
import { ExecutionQueues } from '@/modules/execution-simulator';

export const metadata: Metadata = { title: 'Simulation review · Admin' };

/** Simulation Review + Approval queues page. */
export default function ExecutionReviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Simulation review &amp; approval</h1>
      <p className="max-w-prose text-muted-foreground">
        Active runs, sessions in review, and sessions awaiting a governed decision. Verdicts and
        approvals are decided by accountable humans; these consoles surface the queues.
      </p>
      <ExecutionQueues />
    </div>
  );
}
