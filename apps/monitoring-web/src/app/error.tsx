'use client';

import { MonitorError } from '@/modules/monitoring';

/** Route-level error state for the monitoring app. */
export default function MonitoringError({ reset }: { error: Error; reset: () => void }) {
  return <MonitorError onRetry={reset} />;
}
