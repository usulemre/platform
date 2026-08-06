import { Radio } from 'lucide-react';
import { EmptyState } from '@platform/shell';

/** Signal empty state (no results). */
export function SignalEmptyState() {
  return (
    <EmptyState
      icon={Radio}
      title="No signals found"
      description="No registered signals match your current filters."
    />
  );
}
