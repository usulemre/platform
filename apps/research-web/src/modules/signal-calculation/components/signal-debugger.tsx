'use client';

import { useMemo, useState } from 'react';
import { Button } from '@platform/ui';
import type { SignalKey } from '@platform/signal-calculation-sdk';
import { useDatasets, useDebugSignal, useSignals } from '../hooks/use-signal-calculation';
import type { DebugResultVm, SignalVm } from '../domain/view-model';
import {
  InfoCard,
  SigError,
  SigLoading,
  StatusBadge,
  selectClass,
} from './signal-calculation-atoms';

function DebugTable({ result }: { result: DebugResultVm }) {
  if (result.rows.length === 0)
    return <p className="text-sm text-muted-foreground">No finite signal values to debug.</p>;
  return (
    <InfoCard title={`Per-bar trace — ${result.signalLabel}`}>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Index</th>
              <th className="px-3 py-1.5 text-left font-medium">Date</th>
              {result.componentNames.map((name) => (
                <th key={name} className="px-3 py-1.5 text-right font-medium">
                  {name}
                </th>
              ))}
              <th className="px-3 py-1.5 text-right font-medium">Signal</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.index} className="border-t">
                <td className="px-3 py-1 font-mono text-xs text-muted-foreground">{row.index}</td>
                <td className="px-3 py-1 text-muted-foreground">{row.timeLabel}</td>
                {row.components.map((component) => (
                  <td key={component.name} className="px-3 py-1 text-right font-mono text-xs">
                    {component.value}
                  </td>
                ))}
                <td className="px-3 py-1 text-right">
                  <StatusBadge label={row.signal.label} tone={row.signal.tone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="note" className="mt-2 text-xs text-muted-foreground">
        Each row shows the real feature/indicator operands (computed causally) and the resulting
        signal — the exact inputs to the decision at that bar.
      </p>
    </InfoCard>
  );
}

/** Signal Debugger — inspect the per-bar operands that produce a signal. */
export function SignalDebugger() {
  const signals = useSignals();
  const datasets = useDatasets();
  const debugSignal = useDebugSignal();

  const flat = useMemo<SignalVm[]>(
    () => (signals.data ?? []).flatMap((group) => group.signals),
    [signals.data],
  );
  const [signalKey, setSignalKey] = useState<SignalKey>('ma_crossover');
  const [datasetRef, setDatasetRef] = useState('ds-equity-eod');
  const selected = flat.find((sig) => sig.key === signalKey);

  if (signals.isLoading || datasets.isLoading) return <SigLoading />;
  if (signals.isError) return <SigError onRetry={() => signals.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">Signal</span>
          <select
            aria-label="Signal"
            className={`${selectClass} mt-1`}
            value={signalKey}
            onChange={(event) => setSignalKey(event.target.value as SignalKey)}
          >
            {(signals.data ?? []).map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.signals.map((sig) => (
                  <option key={sig.key} value={sig.key}>
                    {sig.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">Dataset</span>
          <select
            aria-label="Dataset"
            className={`${selectClass} mt-1`}
            value={datasetRef}
            onChange={(event) => setDatasetRef(event.target.value)}
          >
            {(datasets.data ?? []).map((dataset) => (
              <option key={dataset.ref} value={dataset.ref}>
                {dataset.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          onClick={() => debugSignal.mutate({ signalKey, datasetRef })}
          disabled={debugSignal.isPending}
        >
          {debugSignal.isPending ? 'Tracing…' : 'Trace signal'}
        </Button>
      </div>

      {selected ? <p className="text-xs text-muted-foreground">{selected.description}</p> : null}

      {debugSignal.isError ? (
        <SigError onRetry={() => debugSignal.reset()} />
      ) : debugSignal.data ? (
        <DebugTable result={debugSignal.data} />
      ) : (
        <p className="py-8 text-sm text-muted-foreground">
          Choose a signal and trace it to inspect the per-bar operands.
        </p>
      )}
    </div>
  );
}
