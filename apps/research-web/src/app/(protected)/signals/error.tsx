'use client';

import { SignalErrorState } from '@/modules/signal';

/** Route-level error state for the signals segment. */
export default function SignalsError({ reset }: { error: Error; reset: () => void }) {
  return <SignalErrorState onRetry={reset} />;
}
