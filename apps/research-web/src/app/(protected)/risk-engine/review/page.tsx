import type { Metadata } from 'next';
import { RiskReviewQueues } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Risk review & validation · Research Platform' };

/** Risk Review Queue + Validation Queue + Approval Queue + Exceptions page. */
export default function RiskReviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Risk review &amp; validation</h1>
      <p className="max-w-prose text-muted-foreground">
        Assessments in policy/limit validation, risk review, awaiting approval, and with open
        exceptions. Verdicts are decided by deterministic engines and accountable humans; these
        consoles surface the queues.
      </p>
      <RiskReviewQueues />
    </div>
  );
}
