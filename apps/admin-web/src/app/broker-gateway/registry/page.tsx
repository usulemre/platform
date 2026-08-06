import type { Metadata } from 'next';
import { BrokerRegistry } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Broker registry · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Broker registry</h1>
      <BrokerRegistry />
    </div>
  );
}
