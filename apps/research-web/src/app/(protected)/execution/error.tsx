'use client';

import { ExecutionErrorState } from '@/modules/execution';

/** Route-level error state for the execution segment. */
export default function ExecutionError({ reset }: { error: Error; reset: () => void }) {
  return <ExecutionErrorState onRetry={reset} />;
}
