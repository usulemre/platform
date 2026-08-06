import type { Metadata } from 'next';
import { SymbolRegistry } from '@/modules/market-data';

export const metadata: Metadata = { title: 'Symbols · Market Data' };

/** Symbol Registry page. */
export default function SymbolsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Symbol registry</h1>
      <SymbolRegistry />
    </div>
  );
}
