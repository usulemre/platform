import type { Metadata } from 'next';
import { RoutingAudit } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Routing audit · SOR' };

export default function RoutingAuditPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Routing audit</h1>
      <RoutingAudit />
    </div>
  );
}
