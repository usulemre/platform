import type { Metadata } from 'next';
import { SignalBenchmark } from '@/modules/signal-calculation';

export const metadata: Metadata = { title: 'Signal benchmark · Research Platform' };

/** Signal Benchmark page. */
export default function SignalBenchmarkPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Signal benchmark</h1>
      <SignalBenchmark />
    </div>
  );
}
