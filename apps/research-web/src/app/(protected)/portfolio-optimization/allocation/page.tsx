import type { Metadata } from 'next';
import { AllocationExplorer } from '@/modules/portfolio-optimization';

export const metadata: Metadata = { title: 'Allocation explorer · Research Platform' };

/** Allocation Explorer page. */
export default function AllocationExplorerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Allocation explorer</h1>
      <AllocationExplorer />
    </div>
  );
}
