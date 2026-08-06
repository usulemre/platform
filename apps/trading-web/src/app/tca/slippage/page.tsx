import type { Metadata } from 'next';
import { SlippageAnalytics } from '@/modules/tca';

export const metadata: Metadata = { title: 'Slippage analytics · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Slippage analytics</h1>
      <SlippageAnalytics />
    </div>
  );
}
