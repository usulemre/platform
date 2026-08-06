'use client';

import { OptError } from '@/modules/portfolio-optimization';

/** Route-level error state for the portfolio-optimization segment. */
export default function PortfolioOptimizationErrorRoute({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <OptError onRetry={reset} />;
}
