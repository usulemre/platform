import type { Metadata } from 'next';
import { PerformanceMetrics } from '@/modules/feature-calculation';

export const metadata: Metadata = { title: 'Performance metrics · Research Platform' };

/** Performance Metrics page. */
export default function PerformanceMetricsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Performance metrics</h1>
      <PerformanceMetrics />
    </div>
  );
}
