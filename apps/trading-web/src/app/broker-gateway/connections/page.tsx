import type { Metadata } from 'next';
import { ConnectionManager } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Connection manager · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Connection manager</h1>
      <ConnectionManager />
    </div>
  );
}
