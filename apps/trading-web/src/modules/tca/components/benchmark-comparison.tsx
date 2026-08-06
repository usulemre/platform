'use client';

import { useState } from 'react';
import { useExecutionBenchmarks, useExecutionRefs, useTcaMetrics } from '../hooks/use-tca';
import { InfoCard, ShareBar, TcaLoading, ToneText, selectClass } from './tca-atoms';
import { BenchmarkTable } from './tca-tables';

/** Benchmark Comparison — the eight-benchmark comparison for a selected execution plus the portfolio
 *  average slippage and favorable rate against each benchmark. */
export function BenchmarkComparison() {
  const refs = useExecutionRefs();
  const [selected, setSelected] = useState<string>('');
  const id = selected || refs.data?.[0]?.id || '';
  const benchmarks = useExecutionBenchmarks(id);
  const metrics = useTcaMetrics();

  if (refs.isLoading || !refs.data) return <TcaLoading rows={8} />;
  return (
    <div className="space-y-4">
      <InfoCard title="Portfolio benchmark averages">
        {metrics.isLoading || !metrics.data ? (
          <TcaLoading rows={4} />
        ) : (
          <div className="space-y-3">
            {metrics.data.benchmarkAverages.map((b) => (
              <div
                key={b.type}
                className="grid grid-cols-[10rem_1fr_5rem_5rem] items-center gap-3 text-sm"
              >
                <span className="font-medium">{b.label}</span>
                <ShareBar pct={b.favorablePct} tone={b.slippageTone} />
                <span className="font-mono text-muted-foreground">{b.favorableRate}</span>
                <ToneText value={b.avgSlippageBps} tone={b.slippageTone} />
              </div>
            ))}
          </div>
        )}
      </InfoCard>
      <InfoCard
        title="Per-execution benchmark comparison"
        action={
          <select
            className={selectClass}
            value={id}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Execution"
          >
            {refs.data.map((ref) => (
              <option key={ref.id} value={ref.id}>
                {ref.id} · {ref.symbol} {ref.side}
              </option>
            ))}
          </select>
        }
      >
        {benchmarks.isLoading || !benchmarks.data ? (
          <TcaLoading rows={8} />
        ) : (
          <BenchmarkTable rows={benchmarks.data} />
        )}
      </InfoCard>
    </div>
  );
}
