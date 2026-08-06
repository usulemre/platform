import type { Metadata } from 'next';
import { OrderReplay } from '@/modules/orders';

export const metadata: Metadata = { title: 'Order replay · Orders' };

export default function OrderReplayPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Order replay</h1>
      <OrderReplay />
    </div>
  );
}
