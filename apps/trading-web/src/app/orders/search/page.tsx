import type { Metadata } from 'next';
import { OrderSearch } from '@/modules/orders';

export const metadata: Metadata = { title: 'Order search · Orders' };

export default function OrderSearchPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Order search</h1>
      <OrderSearch />
    </div>
  );
}
