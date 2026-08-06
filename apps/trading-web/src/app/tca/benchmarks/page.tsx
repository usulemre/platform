import type { Metadata } from 'next';
import { BenchmarkComparison } from '@/modules/tca';

export const metadata: Metadata = { title: 'Benchmark comparison · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Benchmark comparison</h1>
      <BenchmarkComparison />
    </div>
  );
}
