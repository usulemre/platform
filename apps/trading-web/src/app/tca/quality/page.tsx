import type { Metadata } from 'next';
import { ExecutionQualityDashboard } from '@/modules/tca';

export const metadata: Metadata = { title: 'Execution quality · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution quality</h1>
      <ExecutionQualityDashboard />
    </div>
  );
}
