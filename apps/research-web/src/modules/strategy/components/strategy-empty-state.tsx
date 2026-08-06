import { Layers } from 'lucide-react';
import { EmptyState } from '@platform/shell';

/** Strategy empty state (no results). */
export function StrategyEmptyState() {
  return (
    <EmptyState
      icon={Layers}
      title="No strategies found"
      description="No registered strategies match your current filters."
    />
  );
}
