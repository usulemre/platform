import type { Metadata } from 'next';
import { ExposureSummary } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Risk exposures · Research Platform' };

/** Exposure Summary page. */
export default function RiskExposuresPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Exposure summary</h1>
      <ExposureSummary />
    </div>
  );
}
