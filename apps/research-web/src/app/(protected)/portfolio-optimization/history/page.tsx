import type { Metadata } from 'next';
import { OptimizationHistory } from '@/modules/portfolio-optimization';

export const metadata: Metadata = { title: 'Optimization history · Research Platform' };

/** Optimization History page. */
export default function OptimizationHistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Optimization history</h1>
      <OptimizationHistory />
    </div>
  );
}
