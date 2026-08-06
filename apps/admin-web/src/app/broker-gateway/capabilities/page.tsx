import type { Metadata } from 'next';
import { CapabilityExplorer } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Capability explorer · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Capability explorer</h1>
      <CapabilityExplorer />
    </div>
  );
}
