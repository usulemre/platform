'use client';

import { ExecutionError } from '@/modules/execution-simulator';

/** Route-level error state for the execution-simulator segment. */
export default function ExecutionSimulatorErrorRoute({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ExecutionError onRetry={reset} />;
}
