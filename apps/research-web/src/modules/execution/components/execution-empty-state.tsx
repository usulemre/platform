import { PlayCircle } from 'lucide-react';
import { EmptyState } from '@platform/shell';

/** Execution empty state (no results). */
export function ExecutionEmptyState() {
  return (
    <EmptyState
      icon={PlayCircle}
      title="No execution requests found"
      description="No execution requests match your current filters."
    />
  );
}
