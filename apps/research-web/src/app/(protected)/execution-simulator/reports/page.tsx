import type { Metadata } from 'next';
import { ExecutionReports } from '@/modules/execution-simulator';

export const metadata: Metadata = { title: 'Execution reports · Research Platform' };

/** Execution Reports page. */
export default function ExecutionReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution reports</h1>
      <ExecutionReports />
    </div>
  );
}
