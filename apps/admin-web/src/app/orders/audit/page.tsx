import type { Metadata } from 'next';
import { OrderAudit } from '@/modules/orders';

export const metadata: Metadata = { title: 'Order audit · Orders' };

export default function OrderAuditPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Order audit</h1>
      <OrderAudit />
    </div>
  );
}
