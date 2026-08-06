'use client';

import { PerformanceError } from '@/modules/performance-analytics';

/** Route-level error state for the performance-analytics segment. */
export default function PerformanceAnalyticsErrorRoute({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <PerformanceError onRetry={reset} />;
}
