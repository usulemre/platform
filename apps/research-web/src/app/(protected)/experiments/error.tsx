'use client';

import { ExperimentErrorState } from '@/modules/experiment';

/** Route-level error state for the experiments segment. */
export default function ExperimentsError({ reset }: { error: Error; reset: () => void }) {
  return <ExperimentErrorState onRetry={reset} />;
}
