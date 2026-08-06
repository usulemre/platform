import type { Metadata } from 'next';
import { TradingAudit } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Trading audit · Admin' };

/** Trading Audit page. */
export default function TradingAuditPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Trading audit</h1>
      <TradingAudit />
    </div>
  );
}
