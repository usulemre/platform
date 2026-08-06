import type { Metadata } from 'next';
import { PerformanceComparisons } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Performance comparisons · Admin' };

/** Performance Comparison list page. */
export default function PerformanceComparisonsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Performance comparisons</h1>
      <PerformanceComparisons />
    </div>
  );
}
