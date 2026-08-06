import type { Metadata } from 'next';
import { GatewayAudit } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Gateway audit · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Gateway audit</h1>
      <GatewayAudit />
    </div>
  );
}
