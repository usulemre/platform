'use client';

import { ResearchError } from '@/modules/research';

/** Route-level error state for the research segment. */
export default function ResearchErrorRoute({ reset }: { error: Error; reset: () => void }) {
  return <ResearchError onRetry={reset} />;
}
