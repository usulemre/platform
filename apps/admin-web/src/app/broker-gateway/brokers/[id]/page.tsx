import type { Metadata } from 'next';
import { BrokerDetailView } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Broker · Gateway' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Broker {id}</h1>
      <BrokerDetailView id={id} />
    </div>
  );
}
