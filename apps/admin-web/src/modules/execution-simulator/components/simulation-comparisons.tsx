'use client';

import Link from 'next/link';
import { useComparison, useComparisons } from '../hooks/use-execution-simulator';
import { ExecutionEmpty, ExecutionError, ExecutionLoading, InfoCard } from './execution-atoms';

/** Simulation Comparison list — every defined comparison. */
export function SimulationComparisons() {
  const { data, isLoading, isError, refetch } = useComparisons();
  if (isLoading) return <ExecutionLoading />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <ExecutionEmpty label="No comparisons defined." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((comparison) => (
        <InfoCard key={comparison.id} title={comparison.name}>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{comparison.note}</p>
            <p className="text-xs uppercase text-muted-foreground">
              {comparison.sessionCount} sessions · {comparison.metricCount} metrics ·{' '}
              {comparison.createdLabel}
            </p>
            <Link
              href={`/execution-simulator/comparisons/${comparison.id}`}
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

/** Simulation Comparison table — side-by-side supplied metric values (nothing computed). */
export function SimulationComparisonView({ comparisonId }: { comparisonId: string }) {
  const { data, isLoading, isError, refetch } = useComparison(comparisonId);
  if (isLoading) return <ExecutionLoading />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  if (!data) return <ExecutionEmpty label="No comparison matches this identifier." />;

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
              <th className="px-3 py-2 text-left font-medium">Session</th>
              {data.metricColumns.map((column) => (
                <th key={column.key} className="px-3 py-2 text-right font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.sessionId} className="border-t">
                <td className="px-3 py-2">
                  <Link
                    href={`/execution-simulator/${row.sessionId}`}
                    className="font-medium hover:underline"
                  >
                    {row.sessionName}
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
        Values are pulled from each session&apos;s reported metrics — never computed, ranked or
        scored by this console.
      </p>
    </div>
  );
}
