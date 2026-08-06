import type { Metadata } from 'next';
import { ExecutionQueues } from '@/modules/execution-simulator';

export const metadata: Metadata = { title: 'Execution queue · Research Platform' };

/** Execution + review + approval queues page. */
export default function ExecutionQueuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution queue</h1>
      <p className="max-w-prose text-muted-foreground">
        Active simulation runs and sessions awaiting a governed decision. Runs execute in the
        simulator and approvals are made by governance; these consoles surface the queues.
      </p>
      <ExecutionQueues />
    </div>
  );
}
