import type { Metadata } from 'next';
import { ExecutionReplay } from '@/modules/tca';

export const metadata: Metadata = { title: 'Execution replay · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution replay</h1>
      <ExecutionReplay />
    </div>
  );
}
