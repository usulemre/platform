import type { Metadata } from 'next';
import { ExecutionReplay } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution replay · Orders' };

export default function ExecutionReplayPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution replay</h1>
      <ExecutionReplay />
    </div>
  );
}
