import type { Metadata } from 'next';
import { OrderSynchronization } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Order sync · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Order synchronization</h1>
      <OrderSynchronization />
    </div>
  );
}
