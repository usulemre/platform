import type { Metadata } from 'next';
import { OrderBlotter } from '@/modules/orders';

export const metadata: Metadata = { title: 'Cancelled orders · Orders' };

export default function CancelledOrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Cancelled orders</h1>
      <OrderBlotter scope="CANCELLED" title="Cancelled orders" emptyLabel="No cancelled orders." />
    </div>
  );
}
