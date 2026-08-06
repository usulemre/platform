import type { Metadata } from 'next';
import { RiskDashboard, RiskAssessmentsView } from '@/modules/risk';

export const metadata: Metadata = {
  title: 'Risk · Research Platform',
};

/** Risk Dashboard + Assessment List page (Server Component). Interactive parts
 *  are Client Components that fetch through the application service. */
export default function RiskPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Risk</h1>
        <p className="max-w-prose text-muted-foreground">
          Advisory risk assessments of portfolios, strategies and execution candidates against
          institutional risk policies. Read-only — this console never authorizes production
          execution.
        </p>
      </div>
      <RiskDashboard />
      <RiskAssessmentsView />
    </div>
  );
}
