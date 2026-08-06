import type { Metadata } from 'next';
import { MarketImpactAnalytics } from '@/modules/tca';

export const metadata: Metadata = { title: 'Market impact · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Market impact analytics</h1>
      <MarketImpactAnalytics />
    </div>
  );
}
