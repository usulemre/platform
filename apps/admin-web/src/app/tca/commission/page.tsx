import type { Metadata } from 'next';
import { CommissionAnalytics } from '@/modules/tca';

export const metadata: Metadata = { title: 'Commission analytics · TCA' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Commission analytics</h1>
      <CommissionAnalytics />
    </div>
  );
}
