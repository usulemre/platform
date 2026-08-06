'use client';

import { FeatureErrorState } from '@/modules/feature';

/** Route-level error state for the features segment. */
export default function FeaturesError({ reset }: { error: Error; reset: () => void }) {
  return <FeatureErrorState onRetry={reset} />;
}
