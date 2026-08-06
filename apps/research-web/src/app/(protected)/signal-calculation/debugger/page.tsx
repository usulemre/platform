import type { Metadata } from 'next';
import { SignalDebugger } from '@/modules/signal-calculation';

export const metadata: Metadata = { title: 'Signal debugger · Research Platform' };

/** Signal Debugger page. */
export default function SignalDebuggerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Signal debugger</h1>
      <SignalDebugger />
    </div>
  );
}
