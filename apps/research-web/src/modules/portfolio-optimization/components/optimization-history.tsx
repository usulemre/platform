'use client';

import { useState } from 'react';
import {
  useBenchmarkSuite,
  useExecutionHistory,
  usePerformanceMetrics,
  useUniverses,
} from '../hooks/use-portfolio-optimization';
import {
  InfoCard,
  OptEmpty,
  OptError,
  OptLoading,
  StatusBadge,
  selectClass,
} from './portfolio-optimization-atoms';

function HistorySection() {
  const { data, isLoading, isError, refetch } = useExecutionHistory();
  if (isLoading) return <OptLoading />;
  if (isError) return <OptError onRetry={() => refetch()} />;
  const records = data ?? [];
  return (
    <InfoCard title="Optimization history">
      {records.length === 0 ? (
        <OptEmpty label="No optimizations yet — run one in the allocation explorer." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Method</th>
                <th className="px-3 py-1.5 text-left font-medium">Universe</th>
                <th className="px-3 py-1.5 text-right font-medium">Volatility</th>
                <th className="px-3 py-1.5 text-right font-medium">Sharpe</th>
                <th className="px-3 py-1.5 text-right font-medium">Iters</th>
                <th className="px-3 py-1.5 text-left font-medium">Valid</th>
                <th className="px-3 py-1.5 text-left font-medium">At</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t">
                  <td className="px-3 py-1 font-medium">
                    {record.optimizerLabel}
                    {record.cached ? (
                      <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                        cached
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                    {record.universeRef}
                  </td>
                  <td className="px-3 py-1 text-right font-mono">{record.volatility}</td>
                  <td className="px-3 py-1 text-right font-mono">{record.sharpe}</td>
                  <td className="px-3 py-1 text-right font-mono">{record.iterations}</td>
                  <td className="px-3 py-1">
                    <StatusBadge
                      label={record.validationPassed ? 'Pass' : 'Fail'}
                      tone={record.validationPassed ? 'positive' : 'danger'}
                    />
                  </td>
                  <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                    {record.atLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  );
}

function PerformanceSection() {
  const { data, isLoading } = usePerformanceMetrics();
  if (isLoading) return <OptLoading rows={3} />;
  if (!data || data.length === 0) return null;
  return (
    <InfoCard title="Performance overview">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Method</th>
              <th className="px-3 py-1.5 text-right font-medium">Runs</th>
              <th className="px-3 py-1.5 text-right font-medium">Mean duration</th>
              <th className="px-3 py-1.5 text-right font-medium">Mean iters</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.optimizerKey} className="border-t">
                <td className="px-3 py-1 font-medium">{row.label}</td>
                <td className="px-3 py-1 text-right font-mono">{row.runs}</td>
                <td className="px-3 py-1 text-right font-mono">{row.meanDurationMs}</td>
                <td className="px-3 py-1 text-right font-mono">{row.meanIterations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoCard>
  );
}

function BenchmarkSection() {
  const universes = useUniverses();
  const [universeRef, setUniverseRef] = useState('univ-equity-10');
  const [enabled, setEnabled] = useState(false);
  const benchmark = useBenchmarkSuite(universeRef, enabled);
  return (
    <InfoCard title="Optimization benchmark">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">Universe</span>
          <select
            aria-label="Universe"
            className={`${selectClass} mt-1`}
            value={universeRef}
            onChange={(event) => {
              setUniverseRef(event.target.value);
              setEnabled(false);
            }}
          >
            {(universes.data ?? []).map((universe) => (
              <option key={universe.ref} value={universe.ref}>
                {universe.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setEnabled(true)}
          className="h-10 rounded-md border px-3 text-sm hover:bg-accent"
        >
          Run benchmark
        </button>
      </div>
      {!enabled ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Choose a universe and run the benchmark to measure real optimizer throughput.
        </p>
      ) : benchmark.isLoading ? (
        <div className="mt-3">
          <OptLoading />
        </div>
      ) : benchmark.isError ? (
        <div className="mt-3">
          <OptError onRetry={() => benchmark.refetch()} />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Method</th>
                <th className="px-3 py-1.5 text-left font-medium">Category</th>
                <th className="px-3 py-1.5 text-right font-medium">Mean latency</th>
                <th className="px-3 py-1.5 text-right font-medium">Ops/sec</th>
              </tr>
            </thead>
            <tbody>
              {(benchmark.data ?? []).map((row) => (
                <tr key={row.optimizerKey} className="border-t">
                  <td className="px-3 py-1 font-medium">{row.label}</td>
                  <td className="px-3 py-1">
                    <StatusBadge label={row.category} tone="neutral" />
                  </td>
                  <td className="px-3 py-1 text-right font-mono">{row.meanMs}</td>
                  <td className="px-3 py-1 text-right font-mono">{row.opsPerSecond}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  );
}

/** Optimization History — execution history, aggregate performance and the optimizer benchmark. */
export function OptimizationHistory() {
  return (
    <div className="space-y-4">
      <HistorySection />
      <PerformanceSection />
      <BenchmarkSection />
    </div>
  );
}
