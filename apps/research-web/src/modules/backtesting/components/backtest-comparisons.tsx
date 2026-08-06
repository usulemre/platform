'use client';

import Link from 'next/link';
import { useComparison, useComparisons } from '../hooks/use-backtesting';
import {
  BacktestingEmpty,
  BacktestingError,
  BacktestingLoading,
  InfoCard,
} from './backtesting-atoms';

/** Backtest Comparison list — every defined comparison. */
export function BacktestComparisons() {
  const { data, isLoading, isError, refetch } = useComparisons();
  if (isLoading) return <BacktestingLoading />;
  if (isError) return <BacktestingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <BacktestingEmpty label="No comparisons defined." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((comparison) => (
        <InfoCard key={comparison.id} title={comparison.name}>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{comparison.note}</p>
            <p className="text-xs uppercase text-muted-foreground">
              {comparison.backtestCount} backtests · {comparison.metricCount} metrics ·{' '}
              {comparison.createdLabel}
            </p>
            <Link
              href={`/backtesting/comparisons/${comparison.id}`}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Open comparison
            </Link>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}

/** Backtest Comparison table — side-by-side supplied metric values (nothing computed). */
export function BacktestComparisonView({ comparisonId }: { comparisonId: string }) {
  const { data, isLoading, isError, refetch } = useComparison(comparisonId);
  if (isLoading) return <BacktestingLoading />;
  if (isError) return <BacktestingError onRetry={() => refetch()} />;
  if (!data) return <BacktestingEmpty label="No comparison matches this identifier." />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{data.name}</h2>
        <p className="text-sm text-muted-foreground">{data.note}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Backtest</th>
              {data.metricColumns.map((column) => (
                <th key={column.key} className="px-3 py-2 text-right font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.backtestId} className="border-t">
                <td className="px-3 py-2">
                  <Link
                    href={`/backtesting/${row.backtestId}`}
                    className="font-medium hover:underline"
                  >
                    {row.backtestName}
                  </Link>
                </td>
                {row.cells.map((cell) => (
                  <td key={cell.key} className="px-3 py-2 text-right font-mono">
                    {cell.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="note" className="text-xs text-muted-foreground">
        Values are pulled from each backtest&apos;s reported metrics — never computed, ranked or
        scored by this console.
      </p>
    </div>
  );
}
