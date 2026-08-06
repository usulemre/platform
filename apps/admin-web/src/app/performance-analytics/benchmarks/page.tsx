import type { Metadata } from 'next';
import { BenchmarkList } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Benchmarks · Admin' };

/** Benchmark registry page. */
export default function BenchmarksPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Benchmarks</h1>
      <BenchmarkList />
    </div>
  );
}
