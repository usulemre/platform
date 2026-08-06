import type { Metadata } from 'next';
import { BacktestComparisons } from '@/modules/backtesting';

export const metadata: Metadata = { title: 'Backtest comparisons · Research Platform' };

/** Backtest Comparison list page. */
export default function BacktestComparisonsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Backtest comparisons</h1>
      <BacktestComparisons />
    </div>
  );
}
