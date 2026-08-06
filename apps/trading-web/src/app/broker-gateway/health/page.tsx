import type { Metadata } from 'next';
import { BrokerHealth } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Broker health · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Broker health</h1>
      <BrokerHealth />
    </div>
  );
}
