import type { Metadata } from 'next';
import { VenueHealth } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Venue health · SOR' };

export default function VenueHealthPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Venue health</h1>
      <VenueHealth />
    </div>
  );
}
