import type { Metadata } from 'next';
import { SessionManager } from '@/modules/broker-gateway';

export const metadata: Metadata = { title: 'Session manager · Gateway' };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Session manager</h1>
      <SessionManager />
    </div>
  );
}
