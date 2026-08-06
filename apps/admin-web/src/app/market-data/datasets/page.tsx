import type { Metadata } from 'next';
import { DatasetExplorer } from '@/modules/market-data';

export const metadata: Metadata = { title: 'Datasets · Market Data' };

/** Dataset Explorer page. */
export default function DatasetsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Dataset explorer</h1>
      <DatasetExplorer />
    </div>
  );
}
