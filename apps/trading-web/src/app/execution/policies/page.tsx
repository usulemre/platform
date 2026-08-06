import type { Metadata } from 'next';
import { ExecutionPolicies } from '@/modules/execution';

export const metadata: Metadata = { title: 'Execution policies · Orders' };

export default function ExecutionPoliciesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution policies</h1>
      <ExecutionPolicies />
    </div>
  );
}
