'use client';

import { useBacktestFamilies } from '../hooks/use-backtesting';
import {
  BacktestingEmpty,
  BacktestingError,
  BacktestingLoading,
  InfoCard,
} from './backtesting-atoms';

/** Backtest Families / Namespaces — groupings of related backtests. */
export function BacktestFamilies() {
  const { data, isLoading, isError, refetch } = useBacktestFamilies();

  if (isLoading) return <BacktestingLoading />;
  if (isError) return <BacktestingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <BacktestingEmpty label="No backtest families." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((family) => (
        <InfoCard key={family.id} title={`${family.namespace} / ${family.family}`}>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{family.description}</p>
            <p className="text-xs uppercase text-muted-foreground">
              {family.backtestCount} {family.backtestCount === 1 ? 'backtest' : 'backtests'}
            </p>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}
