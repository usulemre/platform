import type { Metadata } from 'next';
import { BalanceSynchronization } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Balance sync · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Balance synchronization</h1>
      <BalanceSynchronization />
    </div>
  );
}
