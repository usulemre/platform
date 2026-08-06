import type { Metadata } from 'next';
import { VenueComparison } from '@/modules/tca';

export const metadata: Metadata = { title: 'Venue comparison · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Venue comparison</h1>
      <VenueComparison />
    </div>
  );
}
