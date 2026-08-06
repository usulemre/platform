import type { Metadata } from 'next';
import { ExchangeConnections } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Exchange connections · Admin' };

/** Exchange / Broker Connections page. */
export default function ExchangeConnectionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Exchange connections</h1>
      <ExchangeConnections />
    </div>
  );
}
