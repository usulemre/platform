import type { Metadata } from 'next';
import { ExecutionScopeView } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution queue · Orders' };

export default function ExecutionQueuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution queue</h1>
      <ExecutionScopeView
        scope="QUEUE"
        title="Queued & validated executions"
        emptyLabel="The queue is empty."
      />
    </div>
  );
}
