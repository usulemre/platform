import type { Metadata } from 'next';
import { RiskAuditTimeline } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Risk audit · Admin' };

/** Risk Audit Timeline page. */
export default function RiskAuditPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Risk audit timeline</h1>
      <RiskAuditTimeline />
    </div>
  );
}
