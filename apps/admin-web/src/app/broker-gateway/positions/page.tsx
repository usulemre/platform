import type { Metadata } from 'next';
import { PositionSynchronization } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Position sync · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Position synchronization</h1>
      <PositionSynchronization />
    </div>
  );
}
