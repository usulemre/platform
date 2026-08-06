import type { Metadata } from 'next';
import { CostAttribution } from '@/modules/tca';

export const metadata: Metadata = { title: 'Cost attribution · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Cost attribution</h1>
      <CostAttribution />
    </div>
  );
}
