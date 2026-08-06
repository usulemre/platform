import { FlaskConical } from 'lucide-react';
import { EmptyState } from '@platform/shell';

/** Experiment empty state (no results). */
export function ExperimentEmptyState() {
  return (
    <EmptyState
      icon={FlaskConical}
      title="No experiments found"
      description="No registered experiments match your current filters."
    />
  );
}
