import type { Metadata } from 'next';
import { DeploymentHistory } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Deployment history · Research Platform' };

/** Deployment History page. */
export default function DeploymentHistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Deployment history</h1>
      <DeploymentHistory />
    </div>
  );
}
