import type { Metadata } from 'next';
import { AssetRegistry } from '@/modules/market-data';

export const metadata: Metadata = { title: 'Assets · Market Data' };

/** Asset Registry page. */
export default function AssetsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Asset registry</h1>
      <AssetRegistry />
    </div>
  );
}
