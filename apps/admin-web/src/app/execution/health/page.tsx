import type { Metadata } from 'next';
import { ExecutionHealth } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution health · Orders' };

export default function ExecutionHealthPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution health</h1>
      <ExecutionHealth />
    </div>
  );
}
