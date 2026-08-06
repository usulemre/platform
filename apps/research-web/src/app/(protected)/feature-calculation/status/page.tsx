import type { Metadata } from 'next';
import { ExecutionStatus } from '@/modules/feature-calculation';

export const metadata: Metadata = { title: 'Execution status · Research Platform' };

/** Execution Status page. */
export default function ExecutionStatusPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution status</h1>
      <ExecutionStatus />
    </div>
  );
}
