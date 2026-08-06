import { Database } from 'lucide-react';
import { EmptyState } from '@platform/shell';

/** Dataset empty state (no results). */
export function DatasetEmptyState() {
  return (
    <EmptyState
      icon={Database}
      title="No datasets found"
      description="No registered datasets match your current filters."
    />
  );
}
