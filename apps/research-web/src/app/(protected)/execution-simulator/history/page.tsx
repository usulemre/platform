import type { Metadata } from 'next';
import { SimulationHistory } from '@/modules/execution-simulator';

export const metadata: Metadata = { title: 'Simulation history · Research Platform' };

/** Simulation History page. */
export default function SimulationHistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Simulation history</h1>
      <SimulationHistory />
    </div>
  );
}
