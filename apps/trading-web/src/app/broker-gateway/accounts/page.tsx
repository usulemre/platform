import type { Metadata } from 'next';
import { AccountManager } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Account manager · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Account manager</h1>
      <AccountManager />
    </div>
  );
}
