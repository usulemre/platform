import type { Metadata } from 'next';
import { ApprovalQueue } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Deployment approvals · Admin' };

/** Deployment Approval Queue page. */
export default function DeploymentApprovalsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Deployment approvals</h1>
      <ApprovalQueue />
    </div>
  );
}
