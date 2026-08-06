import type { Metadata } from 'next';
import { ExecutionMetrics } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution metrics · Orders' };

export default function ExecutionMetricsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution metrics</h1>
      <ExecutionMetrics />
    </div>
  );
}
