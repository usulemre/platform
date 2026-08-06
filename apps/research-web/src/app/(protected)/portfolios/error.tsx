'use client';

import { PortfolioErrorState } from '@/modules/portfolio';

/** Route-level error state for the portfolios segment. */
export default function PortfoliosError({ reset }: { error: Error; reset: () => void }) {
  return <PortfolioErrorState onRetry={reset} />;
}
