'use client';

import { RiskErrorState } from '@/modules/risk';

/** Route-level error state for the risk segment. */
export default function RiskError({ reset }: { error: Error; reset: () => void }) {
  return <RiskErrorState onRetry={reset} />;
}
