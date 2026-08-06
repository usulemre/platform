import type { Metadata } from 'next';
import { SimulationComparisons } from '@/modules/execution-simulator';

export const metadata: Metadata = { title: 'Simulation comparisons · Admin' };

/** Simulation Comparison list page. */
export default function SimulationComparisonsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Simulation comparisons</h1>
      <SimulationComparisons />
    </div>
  );
}
