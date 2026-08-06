import type { Metadata } from 'next';
import { FeatureBenchmark } from '@/modules/feature-calculation';

export const metadata: Metadata = { title: 'Feature benchmark · Research Platform' };

/** Feature Benchmark page. */
export default function FeatureBenchmarkPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Feature benchmark</h1>
      <FeatureBenchmark />
    </div>
  );
}
