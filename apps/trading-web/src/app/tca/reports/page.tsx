import type { Metadata } from 'next';
import { CostReports } from '@/modules/tca';

export const metadata: Metadata = { title: 'Cost reports · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Cost reports</h1>
      <CostReports />
    </div>
  );
}
