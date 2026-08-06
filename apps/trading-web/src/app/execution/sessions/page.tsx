import type { Metadata } from 'next';
import { ExecutionSessions } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution sessions · Orders' };

export default function ExecutionSessionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution sessions</h1>
      <ExecutionSessions />
    </div>
  );
}
