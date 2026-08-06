import { ShieldQuestion } from 'lucide-react';
import { EmptyState } from '@platform/shell';

/** Risk empty state (no results). */
export function RiskEmptyState() {
  return (
    <EmptyState
      icon={ShieldQuestion}
      title="No risk assessments found"
      description="No risk assessments match your current filters."
    />
  );
}
