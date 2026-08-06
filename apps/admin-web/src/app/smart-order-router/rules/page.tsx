import type { Metadata } from 'next';
import { RoutingRules } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Routing rules · SOR' };

export default function RoutingRulesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Routing rules</h1>
      <RoutingRules />
    </div>
  );
}
