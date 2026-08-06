'use client';

import { StrategyErrorState } from '@/modules/strategy';

/** Route-level error state for the strategies segment. */
export default function StrategiesError({ reset }: { error: Error; reset: () => void }) {
  return <StrategyErrorState onRetry={reset} />;
}
