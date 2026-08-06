'use client';

import { FeatureStoreError } from '@/modules/feature-store';

/** Route-level error state for the feature-store segment. */
export default function FeatureStoreErrorRoute({ reset }: { error: Error; reset: () => void }) {
  return <FeatureStoreError onRetry={reset} />;
}
