import type { Metadata } from 'next';
import { ConnectivityMonitor } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Connectivity monitor · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Connectivity monitor</h1>
      <ConnectivityMonitor />
    </div>
  );
}
