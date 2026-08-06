import type { Metadata } from 'next';
import { ExecutionScopeView } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution history · Orders' };

export default function ExecutionHistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution history</h1>
      <ExecutionScopeView scope="ALL" title="All executions" emptyLabel="No executions." />
    </div>
  );
}
