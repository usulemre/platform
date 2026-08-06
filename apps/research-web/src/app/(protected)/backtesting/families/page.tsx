import type { Metadata } from 'next';
import { BacktestFamilies } from '@/modules/backtesting';

export const metadata: Metadata = { title: 'Backtest families · Research Platform' };

/** Backtest Families page. */
export default function BacktestFamiliesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Backtest families</h1>
      <BacktestFamilies />
    </div>
  );
}
