import type { Metadata } from 'next';
import { GatewayMetrics } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Gateway metrics' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Gateway metrics</h1>
      <GatewayMetrics />
    </div>
  );
}
