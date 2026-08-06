import type { Metadata } from 'next';
import { OrderTimeline } from '@/modules/orders';

export const metadata: Metadata = { title: 'Order timeline · Orders' };

export default function OrderTimelinePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Order timeline</h1>
      <OrderTimeline />
    </div>
  );
}
