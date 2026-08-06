import type { Metadata } from 'next';
import { BacktestQueues } from '@/modules/backtesting';

export const metadata: Metadata = { title: 'Backtest queue · Research Platform' };

/** Backtest execution + approval queues page. */
export default function BacktestQueuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Backtest queue</h1>
      <p className="max-w-prose text-muted-foreground">
        Active runs and backtests awaiting a governed decision. Runs execute in the simulation
        runner and approvals are made by governance; these consoles surface the queues.
      </p>
      <BacktestQueues />
    </div>
  );
}
