'use client';

import {
  useExecutionHistory,
  useExecutionStatus,
  usePerformanceMetrics,
} from '../hooks/use-feature-calculation';
import type { ExecutionRecordVm } from '../domain/view-model';
import {
  CalcEmpty,
  CalcError,
  CalcLoading,
  InfoCard,
  StatusBadge,
} from './feature-calculation-atoms';

function ExecutionTable({ records }: { records: readonly ExecutionRecordVm[] }) {
  if (records.length === 0)
    return <CalcEmpty label="No executions yet — run a calculation in the explorer." />;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Calculation</th>
            <th className="px-3 py-1.5 text-left font-medium">Dataset</th>
            <th className="px-3 py-1.5 text-right font-medium">Duration</th>
            <th className="px-3 py-1.5 text-right font-medium">Finite</th>
            <th className="px-3 py-1.5 text-left font-medium">Validated</th>
            <th className="px-3 py-1.5 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-t">
              <td className="px-3 py-1 font-medium">
                {record.featureLabel}
                {record.cached ? (
                  <span className="ml-1 text-[10px] uppercase text-muted-foreground">cached</span>
                ) : null}
              </td>
              <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                {record.datasetRef}
              </td>
              <td className="px-3 py-1 text-right font-mono">{record.durationMs}</td>
              <td className="px-3 py-1 text-right font-mono">{record.finiteRatio}</td>
              <td className="px-3 py-1">
                <StatusBadge
                  label={record.validationPassed ? 'Pass' : 'Fail'}
                  tone={record.validationPassed ? 'positive' : 'danger'}
                />
              </td>
              <td className="px-3 py-1 text-right">
                <StatusBadge label={record.status.label} tone={record.status.tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Execution History — all recorded calculation executions. */
export function ExecutionHistory() {
  const { data, isLoading, isError, refetch } = useExecutionHistory();
  if (isLoading) return <CalcLoading />;
  if (isError) return <CalcError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Execution history">
      <ExecutionTable records={data ?? []} />
    </InfoCard>
  );
}

/** Execution Status — the most recent executions. */
export function ExecutionStatus() {
  const { data, isLoading, isError, refetch } = useExecutionStatus();
  if (isLoading) return <CalcLoading rows={3} />;
  if (isError) return <CalcError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Recent executions">
      <ExecutionTable records={data ?? []} />
    </InfoCard>
  );
}

/** Performance Metrics — aggregate timing per calculation. */
export function PerformanceMetrics() {
  const { data, isLoading, isError, refetch } = usePerformanceMetrics();
  if (isLoading) return <CalcLoading />;
  if (isError) return <CalcError onRetry={() => refetch()} />;
  if (!data || data.length === 0)
    return <CalcEmpty label="No performance data — run some calculations first." />;
  return (
    <InfoCard title="Performance metrics">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Calculation</th>
              <th className="px-3 py-1.5 text-right font-medium">Runs</th>
              <th className="px-3 py-1.5 text-right font-medium">Cached</th>
              <th className="px-3 py-1.5 text-right font-medium">Mean duration</th>
              <th className="px-3 py-1.5 text-right font-medium">Bars/sec</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.featureKey} className="border-t">
                <td className="px-3 py-1 font-medium">{row.label}</td>
                <td className="px-3 py-1 text-right font-mono">{row.runs}</td>
                <td className="px-3 py-1 text-right font-mono">{row.cachedRuns}</td>
                <td className="px-3 py-1 text-right font-mono">{row.meanDurationMs}</td>
                <td className="px-3 py-1 text-right font-mono">{row.barsPerSecond}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoCard>
  );
}
