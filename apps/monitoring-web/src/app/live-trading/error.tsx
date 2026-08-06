'use client';

import { TradingError } from '@/modules/live-trading';

/** Route-level error state for the live-trading monitoring segment. */
export default function LiveTradingErrorRoute({ reset }: { error: Error; reset: () => void }) {
  return <TradingError onRetry={reset} />;
}
