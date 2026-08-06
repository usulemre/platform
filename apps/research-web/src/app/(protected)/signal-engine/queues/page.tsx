import type { Metadata } from 'next';
import { SignalQueues } from '@/modules/signal-engine';

export const metadata: Metadata = { title: 'Signal queues · Research Platform' };

/** Signal promotion + approval queues page. */
export default function SignalQueuesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Signal queues</h1>
      <p className="max-w-prose text-muted-foreground">
        Signals awaiting a governed decision — promotion to a production candidate, or governance
        approval. These consoles surface the queues; the decisions are made elsewhere.
      </p>
      <SignalQueues />
    </div>
  );
}
