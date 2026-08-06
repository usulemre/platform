import type { Metadata } from 'next';
import { OrdersDashboard } from '@/modules/orders';

export const metadata: Metadata = { title: 'Orders · Admin' };

/** Order Management (admin) — Dashboard (Server Component). The interactive sections are Client
 *  Components that read the OMS through the application service. */
export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Order management</h1>
        <p className="max-w-prose text-muted-foreground">
          Administer and audit the Order Management System — the single source of truth for all
          orders before they are routed to execution venues. Oversee the blotter, order lifecycle
          timeline, audit trail, replay, metrics and health. It contains no broker, exchange or FIX
          connectivity and is read-only here.
        </p>
      </div>
      <OrdersDashboard />
    </div>
  );
}
