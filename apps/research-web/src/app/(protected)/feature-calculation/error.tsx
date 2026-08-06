'use client';

import { CalcError } from '@/modules/feature-calculation';

/** Route-level error state for the feature-calculation segment. */
export default function FeatureCalculationErrorRoute({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <CalcError onRetry={reset} />;
}
