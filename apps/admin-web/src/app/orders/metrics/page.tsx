import type { Metadata } from 'next';
import { OrderMetrics } from '@/modules/orders';

export const metadata: Metadata = { title: 'Order metrics · Orders' };

export default function OrderMetricsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Order metrics</h1>
      <OrderMetrics />
    </div>
  );
}
