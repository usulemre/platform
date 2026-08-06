import type { Metadata } from 'next';
import { PerformanceOverview } from '@/modules/signal-calculation';

export const metadata: Metadata = { title: 'Performance overview · Research Platform' };

/** Performance Overview page. */
export default function PerformanceOverviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Performance overview</h1>
      <PerformanceOverview />
    </div>
  );
}
