import { OrdersDashboard } from '@/modules/orders';

/** Order Dashboard page (Server Component). The sections are Client Components that read the OMS
 *  through the application service. */
export default function OrdersHomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Order management</h1>
        <p className="max-w-prose text-muted-foreground">
          The Order Management System — the single source of truth for all orders before they are
          routed to execution venues. Manage the complete order lifecycle across the blotter, active
          and completed orders, the timeline, audit, replay, metrics and health. It contains no
          broker, exchange or FIX connectivity.
        </p>
      </div>
      <OrdersDashboard />
    </div>
  );
}
