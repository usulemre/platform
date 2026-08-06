import type { Metadata } from 'next';
import { ExecutionAudit } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution audit · Orders' };

export default function ExecutionAuditPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution audit</h1>
      <ExecutionAudit />
    </div>
  );
}
