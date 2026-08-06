import type { Metadata } from 'next';
import { RoutingPolicies } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Routing policies · SOR' };

export default function RoutingPoliciesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Routing policies</h1>
      <RoutingPolicies />
    </div>
  );
}
