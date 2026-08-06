import type { Metadata } from 'next';
import { TradingTimeline } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Trading timeline · Monitoring' };

/** Trading Timeline page. */
export default function TradingTimelinePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Trading timeline</h1>
      <TradingTimeline />
    </div>
  );
}
