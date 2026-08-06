import type { Metadata } from 'next';
import { TradingAccounts } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Trading accounts · Admin' };

/** Trading Accounts page. */
export default function TradingAccountsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Trading accounts</h1>
      <TradingAccounts />
    </div>
  );
}
