import type { Metadata } from 'next';
import { OrderBlotter } from '@/modules/orders';

export const metadata: Metadata = { title: 'Active orders · Orders' };

export default function ActiveOrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Active orders</h1>
      <OrderBlotter scope="ACTIVE" title="Active orders" emptyLabel="No active orders." />
    </div>
  );
}
