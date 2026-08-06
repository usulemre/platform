import type { Metadata } from 'next';
import { BrokerDashboard } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Broker Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Broker Gateway</h1>
      <BrokerDashboard />
    </div>
  );
}
