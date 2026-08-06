import type { Metadata } from 'next';
import { SubjectReports } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Strategy performance · Research Platform' };

/** Strategy performance — subject-filtered performance reports. */
export default function StrategyPerformancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Strategy performance</h1>
      <SubjectReports subjectKind="STRATEGY" />
    </div>
  );
}
