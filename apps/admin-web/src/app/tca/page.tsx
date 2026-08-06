import type { Metadata } from 'next';
import { TcaDashboard } from '@/modules/tca';

export const metadata: Metadata = { title: 'TCA · Transaction Cost Analysis' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Transaction Cost Analysis</h1>
      <TcaDashboard />
    </div>
  );
}
