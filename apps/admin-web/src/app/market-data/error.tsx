'use client';

import { MarketError } from '@/modules/market-data';

/** Route-level error state for the market-data segment. */
export default function MarketDataError({ reset }: { error: Error; reset: () => void }) {
  return <MarketError onRetry={reset} />;
}
