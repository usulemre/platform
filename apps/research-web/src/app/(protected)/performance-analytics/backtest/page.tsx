import type { Metadata } from 'next';
import { SubjectReports } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Backtest performance · Research Platform' };

/** Backtest performance — subject-filtered performance reports. */
export default function BacktestPerformancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Backtest performance</h1>
      <SubjectReports subjectKind="BACKTEST" />
    </div>
  );
}
