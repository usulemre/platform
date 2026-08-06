import type { Metadata } from 'next';
import { MarketCalendar } from '@/modules/market-data';

export const metadata: Metadata = { title: 'Calendar · Market Data' };

/** Market Calendar + Trading Sessions page. */
export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Market calendar</h1>
      <MarketCalendar />
    </div>
  );
}
