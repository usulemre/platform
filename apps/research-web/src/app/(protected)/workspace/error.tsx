'use client';

import { WorkspaceErrorState } from '@/modules/workspace';

/** Route-level error state for the workspace segment. */
export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return <WorkspaceErrorState onRetry={reset} />;
}
