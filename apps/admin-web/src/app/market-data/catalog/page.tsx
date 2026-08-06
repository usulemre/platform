import type { Metadata } from 'next';
import { DataCatalog } from '@/modules/market-data';

export const metadata: Metadata = { title: 'Catalog · Market Data' };

/** Data Catalog page. */
export default function CatalogPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Data catalog</h1>
      <DataCatalog />
    </div>
  );
}
