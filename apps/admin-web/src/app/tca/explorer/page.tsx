import type { Metadata } from 'next';
import { ExecutionCostExplorer } from '@/modules/tca';

export const metadata: Metadata = { title: 'Cost explorer · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution cost explorer</h1>
      <ExecutionCostExplorer />
    </div>
  );
}
