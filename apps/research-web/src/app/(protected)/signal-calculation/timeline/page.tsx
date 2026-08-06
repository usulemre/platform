import type { Metadata } from 'next';
import { ExecutionTimeline } from '@/modules/signal-calculation';

export const metadata: Metadata = { title: 'Execution timeline · Research Platform' };

/** Execution Timeline page. */
export default function ExecutionTimelinePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution timeline</h1>
      <ExecutionTimeline />
    </div>
  );
}
