'use client';

import {
  useExecutionHistory,
  useExecutionStatus,
  usePerformanceMetrics,
} from '../hooks/use-signal-calculation';
import type { ExecutionRecordVm } from '../domain/view-model';
import { InfoCard, SigEmpty, SigError, SigLoading, StatusBadge } from './signal-calculation-atoms';

function ExecutionTable({ records }: { records: readonly ExecutionRecordVm[] }) {
  if (records.length === 0)
    return <SigEmpty label="No executions yet — generate a signal in the explorer." />;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Signal</th>
            <th className="px-3 py-1.5 text-left font-medium">Dataset</th>
            <th className="px-3 py-1.5 text-right font-medium">Duration</th>
            <th className="px-3 py-1.5 text-right font-medium">Active</th>
            <th className="px-3 py-1.5 text-left font-medium">Validated</th>
            <th className="px-3 py-1.5 text-left font-medium">At</th>
            <th className="px-3 py-1.5 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-t">
              <td className="px-3 py-1 font-medium">
                {record.signalLabel}
                {record.cached ? (
                  <span className="ml-1 text-[10px] uppercase text-muted-foreground">cached</span>
                ) : null}
              </td>
              <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                {record.datasetRef}
              </td>
              <td className="px-3 py-1 text-right font-mono">{record.durationMs}</td>
              <td className="px-3 py-1 text-right font-mono">{record.activeRatio}</td>
              <td className="px-3 py-1">
                <StatusBadge
                  label={record.validationPassed ? 'Pass' : 'Fail'}
                  tone={record.validationPassed ? 'positive' : 'danger'}
                />
              </td>
              <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                {record.atLabel}
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

/** Execution Timeline — all recorded signal executions, newest first. */
export function ExecutionTimeline() {
  const { data, isLoading, isError, refetch } = useExecutionHistory();
  if (isLoading) return <SigLoading />;
  if (isError) return <SigError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Execution timeline">
      <ExecutionTable records={data ?? []} />
    </InfoCard>
  );
}

/** Execution Status — the most recent executions. */
export function ExecutionStatus() {
  const { data, isLoading, isError, refetch } = useExecutionStatus();
  if (isLoading) return <SigLoading rows={3} />;
  if (isError) return <SigError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Recent executions">
      <ExecutionTable records={data ?? []} />
    </InfoCard>
  );
}

/** Performance Overview — aggregate timing per signal. */
export function PerformanceOverview() {
  const { data, isLoading, isError, refetch } = usePerformanceMetrics();
  if (isLoading) return <SigLoading />;
  if (isError) return <SigError onRetry={() => refetch()} />;
  if (!data || data.length === 0)
    return <SigEmpty label="No performance data — generate some signals first." />;
  return (
    <InfoCard title="Performance overview">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Signal</th>
              <th className="px-3 py-1.5 text-right font-medium">Runs</th>
              <th className="px-3 py-1.5 text-right font-medium">Cached</th>
              <th className="px-3 py-1.5 text-right font-medium">Mean duration</th>
              <th className="px-3 py-1.5 text-right font-medium">Bars/sec</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.signalKey} className="border-t">
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
