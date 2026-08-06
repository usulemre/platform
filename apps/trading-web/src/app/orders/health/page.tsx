import type { Metadata } from 'next';
import { OrderHealth } from '@/modules/orders';

export const metadata: Metadata = { title: 'Order health · Orders' };

export default function OrderHealthPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Order health</h1>
      <OrderHealth />
    </div>
  );
}
