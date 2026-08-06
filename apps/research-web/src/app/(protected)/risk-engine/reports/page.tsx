import type { Metadata } from 'next';
import { RiskReports } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Risk reports · Research Platform' };

/** Risk Reports page. */
export default function RiskReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Risk reports</h1>
      <RiskReports />
    </div>
  );
}
