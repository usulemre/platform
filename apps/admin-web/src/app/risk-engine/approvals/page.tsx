import type { Metadata } from 'next';
import { RiskApprovals } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Risk approvals · Admin' };

/** Risk Approval Queue + Exceptions + Overrides page. */
export default function RiskApprovalsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Risk approvals</h1>
      <p className="max-w-prose text-muted-foreground">
        The approval queue, raised exceptions and recorded overrides. Approvals and dispositions are
        governance decisions made by accountable humans; these consoles surface them.
      </p>
      <RiskApprovals />
    </div>
  );
}
