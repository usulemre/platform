import type { Metadata } from 'next';
import { ExecutionScorecards } from '@/modules/tca';

export const metadata: Metadata = { title: 'Execution scorecards · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution scorecards</h1>
      <ExecutionScorecards />
    </div>
  );
}
