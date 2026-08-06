import type { Metadata } from 'next';
import { PerformanceReviewQueues } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Performance review · Admin' };

/** Performance Review + Approval queues page. */
export default function PerformanceReviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Performance review &amp; approval</h1>
      <p className="max-w-prose text-muted-foreground">
        Reports in review and awaiting a governed decision. Verdicts are decided by accountable
        humans; these consoles surface the queues.
      </p>
      <PerformanceReviewQueues />
    </div>
  );
}
