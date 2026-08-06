import type { Metadata } from 'next';
import { VenueExplorer } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Venue explorer · SOR' };

export default function VenueExplorerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Venue explorer</h1>
      <VenueExplorer />
    </div>
  );
}
