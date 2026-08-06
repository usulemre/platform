import type { Metadata } from 'next';
import { CalculationExplorer } from '@/modules/feature-calculation';

export const metadata: Metadata = { title: 'Calculation explorer · Research Platform' };

/** Calculation Explorer page. */
export default function CalculationExplorerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Calculation explorer</h1>
      <CalculationExplorer />
    </div>
  );
}
