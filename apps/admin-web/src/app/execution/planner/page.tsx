import type { Metadata } from 'next';
import { ExecutionPlanner } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution planner · Orders' };

export default function ExecutionPlannerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution planner</h1>
      <ExecutionPlanner />
    </div>
  );
}
