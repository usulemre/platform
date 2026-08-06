import type { Metadata } from 'next';
import { RoutingReplay } from '@/modules/smart-order-router';

export const metadata: Metadata = { title: 'Routing replay · SOR' };

export default function RoutingReplayPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Routing replay</h1>
      <RoutingReplay />
    </div>
  );
}
