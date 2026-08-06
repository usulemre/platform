import type { Metadata } from 'next';
import { OrderBlotter } from '@/modules/orders';

export const metadata: Metadata = { title: 'Order blotter · Orders' };

export default function OrderBlotterPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Order blotter</h1>
      <OrderBlotter scope="ALL" title="All orders" emptyLabel="No orders." />
    </div>
  );
}
