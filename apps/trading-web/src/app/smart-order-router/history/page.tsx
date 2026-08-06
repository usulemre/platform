import type { Metadata } from 'next';
import { RoutingScopeView } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Routing history · SOR' };

export default function RoutingHistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Routing history</h1>
      <RoutingScopeView scope="ALL" title="All routings" emptyLabel="No routings." />
    </div>
  );
}
