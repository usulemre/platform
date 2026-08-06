import type { Metadata } from 'next';
import { RoutingMetrics } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Routing metrics · SOR' };

export default function RoutingMetricsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Routing metrics</h1>
      <RoutingMetrics />
    </div>
  );
}
