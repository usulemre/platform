import type { Metadata } from 'next';
import { ExecutionDetailView } from '@/modules/tca';

export const metadata: Metadata = { title: 'Execution detail · TCA' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Execution {id}</h1>
      <ExecutionDetailView id={id} />
    </div>
  );
}
