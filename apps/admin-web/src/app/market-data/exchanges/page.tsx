import type { Metadata } from 'next';
import { ExchangeRegistry } from '@/modules/market-data';

export const metadata: Metadata = { title: 'Exchanges · Market Data' };

/** Exchange Registry page. */
export default function ExchangesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Exchange registry</h1>
      <ExchangeRegistry />
    </div>
  );
}
