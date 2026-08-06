import type { Metadata } from 'next';
import { SubjectReports } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Portfolio performance · Research Platform' };

/** Portfolio performance — subject-filtered performance reports. */
export default function PortfolioPerformancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Portfolio performance</h1>
      <SubjectReports subjectKind="PORTFOLIO" />
    </div>
  );
}
