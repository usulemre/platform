'use client';

import { SigError } from '@/modules/signal-calculation';

/** Route-level error state for the signal-calculation segment. */
export default function SignalCalculationErrorRoute({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <SigError onRetry={reset} />;
}
