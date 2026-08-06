'use client';

import { useState } from 'react';
import { useBenchmarkSuite, useDatasets } from '../hooks/use-signal-calculation';
import {
  InfoCard,
  SigError,
  SigLoading,
  StatusBadge,
  selectClass,
} from './signal-calculation-atoms';

/** Signal Benchmark — runs the real generators over a dataset and reports throughput. */
export function SignalBenchmark() {
  const datasets = useDatasets();
  const [datasetRef, setDatasetRef] = useState('ds-equity-eod');
  const [enabled, setEnabled] = useState(false);
  const benchmark = useBenchmarkSuite(datasetRef, enabled);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">Dataset</span>
          <select
            aria-label="Dataset"
            className={`${selectClass} mt-1`}
            value={datasetRef}
            onChange={(event) => {
              setDatasetRef(event.target.value);
              setEnabled(false);
            }}
          >
            {(datasets.data ?? []).map((dataset) => (
              <option key={dataset.ref} value={dataset.ref}>
                {dataset.label} ({dataset.bars} bars)
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
        <p className="text-sm text-muted-foreground">
          Choose a dataset and run the benchmark to measure real throughput.
        </p>
      ) : benchmark.isLoading ? (
        <SigLoading />
      ) : benchmark.isError ? (
        <SigError onRetry={() => benchmark.refetch()} />
      ) : (
        <InfoCard title="Benchmark results">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">Signal</th>
                  <th className="px-3 py-1.5 text-left font-medium">Category</th>
                  <th className="px-3 py-1.5 text-right font-medium">Mean latency</th>
                  <th className="px-3 py-1.5 text-right font-medium">Ops/sec</th>
                  <th className="px-3 py-1.5 text-right font-medium">Bars/sec</th>
                </tr>
              </thead>
              <tbody>
                {(benchmark.data ?? []).map((row) => (
                  <tr key={row.signalKey} className="border-t">
                    <td className="px-3 py-1 font-medium">{row.label}</td>
                    <td className="px-3 py-1">
                      <StatusBadge label={row.category} tone="neutral" />
                    </td>
                    <td className="px-3 py-1 text-right font-mono">{row.meanMs}</td>
                    <td className="px-3 py-1 text-right font-mono">{row.opsPerSecond}</td>
                    <td className="px-3 py-1 text-right font-mono">{row.barsPerSecond}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Each signal is warmed up then timed over multiple iterations on{' '}
            {(datasets.data ?? []).find((d) => d.ref === datasetRef)?.bars} bars — real work, real
            timings.
          </p>
        </InfoCard>
      )}
    </div>
  );
}
