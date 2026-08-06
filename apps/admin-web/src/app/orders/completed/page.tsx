import type { Metadata } from 'next';
import { OrderBlotter } from '@/modules/orders';

export const metadata: Metadata = { title: 'Completed orders · Orders' };

export default function CompletedOrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Completed orders</h1>
      <OrderBlotter
        scope="COMPLETED"
        title="Completed (terminal) orders"
        emptyLabel="No completed orders."
      />
    </div>
  );
}
