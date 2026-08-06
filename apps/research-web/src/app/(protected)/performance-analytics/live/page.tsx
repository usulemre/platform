import type { Metadata } from 'next';
import { SubjectReports } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Live trading performance · Research Platform' };

/** Live trading performance — subject-filtered performance reports. */
export default function LivePerformancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Live trading performance</h1>
      <SubjectReports subjectKind="LIVE_SESSION" />
    </div>
  );
}
