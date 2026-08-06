import { Briefcase } from 'lucide-react';
import { EmptyState } from '@platform/shell';

/** Portfolio empty state (no results). */
export function PortfolioEmptyState() {
  return (
    <EmptyState
      icon={Briefcase}
      title="No portfolios found"
      description="No registered portfolios match your current filters."
    />
  );
}
