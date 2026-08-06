import type { Metadata } from 'next';
import { ExecutionHistory } from '@/modules/feature-calculation';

export const metadata: Metadata = { title: 'Execution history · Research Platform' };

/** Execution History page. */
export default function ExecutionHistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution history</h1>
      <ExecutionHistory />
    </div>
  );
}
