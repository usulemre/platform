import type { Metadata } from 'next';
import { RoutingDecisions } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Routing decisions · SOR' };

export default function RoutingDecisionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Routing decisions</h1>
      <RoutingDecisions />
    </div>
  );
}
