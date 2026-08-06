import type { Metadata } from 'next';
import { TradingMetrics } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Trading metrics · Monitoring' };

/** Trading Metrics page. */
export default function TradingMetricsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Trading metrics</h1>
      <TradingMetrics />
    </div>
  );
}
