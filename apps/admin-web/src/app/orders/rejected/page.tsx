import type { Metadata } from 'next';
import { OrderBlotter } from '@/modules/orders';

export const metadata: Metadata = { title: 'Rejected orders · Orders' };

export default function RejectedOrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Rejected orders</h1>
      <OrderBlotter scope="REJECTED" title="Rejected orders" emptyLabel="No rejected orders." />
    </div>
  );
}
