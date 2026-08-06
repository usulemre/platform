import type { Metadata } from 'next';
import { SignalExplorer } from '@/modules/signal-calculation';

export const metadata: Metadata = { title: 'Signal explorer · Research Platform' };

/** Signal Explorer page. */
export default function SignalExplorerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Signal explorer</h1>
      <SignalExplorer />
    </div>
  );
}
