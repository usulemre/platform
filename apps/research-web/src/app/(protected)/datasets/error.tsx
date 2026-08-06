'use client';

import { DatasetErrorState } from '@/modules/dataset';

/** Route-level error state for the datasets segment. */
export default function DatasetsError({ reset }: { error: Error; reset: () => void }) {
  return <DatasetErrorState onRetry={reset} />;
}
