'use client';

import { SignalEngineError } from '@/modules/signal-engine';

/** Route-level error state for the signal-engine segment. */
export default function SignalEngineErrorRoute({ reset }: { error: Error; reset: () => void }) {
  return <SignalEngineError onRetry={reset} />;
}
