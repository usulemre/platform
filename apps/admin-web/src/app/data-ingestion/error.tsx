'use client';

import { IngestionError } from '@/modules/data-ingestion';

/** Route-level error state for the data-ingestion segment. */
export default function DataIngestionError({ reset }: { error: Error; reset: () => void }) {
  return <IngestionError onRetry={reset} />;
}
