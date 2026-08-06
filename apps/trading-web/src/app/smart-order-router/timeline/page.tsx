import type { Metadata } from 'next';
import { RoutingTimeline } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Routing timeline · SOR' };

export default function RoutingTimelinePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Routing timeline</h1>
      <RoutingTimeline />
    </div>
  );
}
