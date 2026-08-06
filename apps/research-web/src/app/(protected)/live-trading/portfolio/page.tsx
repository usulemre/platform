import type { Metadata } from 'next';
import { AccountBalances, ClosedPositions, OpenPositions } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Portfolio overview · Research Platform' };

/** Portfolio Overview — open/closed positions and account balances. */
export default function PortfolioOverviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Portfolio overview</h1>
      <OpenPositions />
      <ClosedPositions />
      <AccountBalances />
    </div>
  );
}
