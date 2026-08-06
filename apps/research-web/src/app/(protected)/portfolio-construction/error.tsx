'use client';

import { PortfolioConstructionError } from '@/modules/portfolio-construction';

/** Route-level error state for the portfolio-construction segment. */
export default function PortfolioConstructionErrorRoute({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <PortfolioConstructionError onRetry={reset} />;
}
