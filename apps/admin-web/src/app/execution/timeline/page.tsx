import type { Metadata } from 'next';
import { ExecutionTimeline } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution timeline · Orders' };

export default function ExecutionTimelinePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution timeline</h1>
      <ExecutionTimeline />
    </div>
  );
}
