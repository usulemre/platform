import type { Metadata } from 'next';
import { ProductionHealth } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Production health · Monitoring' };

/** Production Health page. */
export default function ProductionHealthPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Production health</h1>
      <ProductionHealth />
    </div>
  );
}
