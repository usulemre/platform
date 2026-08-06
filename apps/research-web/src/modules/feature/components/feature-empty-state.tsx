import { Boxes } from 'lucide-react';
import { EmptyState } from '@platform/shell';

/** Feature empty state (no results). */
export function FeatureEmptyState() {
  return (
    <EmptyState
      icon={Boxes}
      title="No features found"
      description="No registered features match your current filters."
    />
  );
}
