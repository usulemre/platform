'use client';

import { BacktestingError } from '@/modules/backtesting';

/** Route-level error state for the backtesting segment. */
export default function BacktestingErrorRoute({ reset }: { error: Error; reset: () => void }) {
  return <BacktestingError onRetry={reset} />;
}
