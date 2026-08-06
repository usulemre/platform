import type { Metadata } from 'next';
import { SignalComparison } from '@/modules/signal-calculation';

export const metadata: Metadata = { title: 'Signal comparison · Research Platform' };

/** Signal Comparison page. */
export default function SignalComparisonPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Signal comparison</h1>
      <SignalComparison />
    </div>
  );
}
