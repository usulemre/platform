'use client';

import { useMemo, useState } from 'react';
import { Button, Input } from '@platform/ui';
import type { SignalKey } from '@platform/signal-calculation-sdk';
import { useDatasets, useRunSignal, useSignals } from '../hooks/use-signal-calculation';
import type { SignalResultVm, SignalVm } from '../domain/view-model';
import {
  InfoCard,
  SigError,
  SigLoading,
  StatusBadge,
  selectClass,
} from './signal-calculation-atoms';

function ResultView({ result }: { result: SignalResultVm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">{result.label}</h3>
        <StatusBadge
          label={result.validationPassed ? 'Validated' : 'Validation failed'}
          tone={result.validationPassed ? 'positive' : 'danger'}
        />
        <StatusBadge label={result.valueKind} tone="info" />
        <span className="text-xs text-muted-foreground">
          {result.paramSummary} · {result.durationMs}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Length</p>
          <p className="text-lg font-semibold">{result.length}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Warm-up</p>
          <p className="text-lg font-semibold">{result.warmup}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Active</p>
          <p className="text-lg font-semibold">{result.activeRatio}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-emerald-600">Long</p>
          <p className="text-lg font-semibold">{result.long}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-red-600">Short</p>
          <p className="text-lg font-semibold">{result.short}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Flat</p>
          <p className="text-lg font-semibold">{result.flat}</p>
        </div>
      </div>

      <InfoCard title="Validation">
        <ul className="space-y-1 text-sm">
          {result.checks.map((check) => (
            <li key={check.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{check.label}</span>{' '}
                <span className="text-xs text-muted-foreground">{check.detail}</span>
              </span>
              <StatusBadge label={check.status.label} tone={check.status.tone} />
            </li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          manifest {result.manifestHash}
        </p>
      </InfoCard>

      <InfoCard title="Signal preview (last values)">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Index</th>
                <th className="px-3 py-1.5 text-left font-medium">Date</th>
                <th className="px-3 py-1.5 text-right font-medium">Signal</th>
              </tr>
            </thead>
            <tbody>
              {result.preview.map((point) => (
                <tr key={point.index} className="border-t">
                  <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                    {point.index}
                  </td>
                  <td className="px-3 py-1 text-muted-foreground">{point.timeLabel}</td>
                  <td className="px-3 py-1 text-right">
                    <StatusBadge label={point.valueLabel} tone={point.tone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {result.dependsOn.length > 0 ? (
            <span>Depends on: {result.dependsOn.join(', ')}</span>
          ) : null}
          {result.features.length > 0 ? <span>Features: {result.features.join(', ')}</span> : null}
        </div>
        <p role="note" className="mt-2 text-xs text-muted-foreground">
          Signals are generated live by the calculation library (real algorithm), then validated for
          value range, determinism and point-in-time causality.
        </p>
      </InfoCard>
    </div>
  );
}

/** Signal Explorer — select a real signal, dataset and parameters, then generate it live. */
export function SignalExplorer() {
  const signals = useSignals();
  const datasets = useDatasets();
  const run = useRunSignal();

  const flat = useMemo<SignalVm[]>(
    () => (signals.data ?? []).flatMap((group) => group.signals),
    [signals.data],
  );
  const [signalKey, setSignalKey] = useState<SignalKey>('ma_crossover');
  const [datasetRef, setDatasetRef] = useState('ds-equity-eod');
  const [params, setParams] = useState<Record<string, number>>({});

  const selected = flat.find((sig) => sig.key === signalKey);

  if (signals.isLoading || datasets.isLoading) return <SigLoading />;
  if (signals.isError) return <SigError onRetry={() => signals.refetch()} />;

  const onSelectSignal = (key: SignalKey) => {
    setSignalKey(key);
    setParams({});
  };

  const paramValue = (name: string, fallback: number): number => params[name] ?? fallback;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <InfoCard title="Signal">
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Signal</span>
            <select
              aria-label="Signal"
              className={`${selectClass} mt-1 w-full`}
              value={signalKey}
              onChange={(event) => onSelectSignal(event.target.value as SignalKey)}
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
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Dataset</span>
            <select
              aria-label="Dataset"
              className={`${selectClass} mt-1 w-full`}
              value={datasetRef}
              onChange={(event) => setDatasetRef(event.target.value)}
            >
              {(datasets.data ?? []).map((dataset) => (
                <option key={dataset.ref} value={dataset.ref}>
                  {dataset.label} ({dataset.bars} bars)
                </option>
              ))}
            </select>
          </label>
          {selected?.params.map((definition) => (
            <label key={definition.name} className="block">
              <span className="text-xs uppercase text-muted-foreground">
                {definition.label} ({definition.min}–{definition.max})
              </span>
              <Input
                type="number"
                min={definition.min}
                max={definition.max}
                step={definition.integer ? 1 : 'any'}
                value={paramValue(definition.name, definition.defaultValue)}
                onChange={(event) =>
                  setParams((prev) => ({ ...prev, [definition.name]: Number(event.target.value) }))
                }
                className="mt-1"
              />
            </label>
          ))}
          {selected ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{selected.description}</p>
              <div className="flex flex-wrap gap-1">
                {selected.inputs.map((input) => (
                  <StatusBadge key={input} label={input} tone="neutral" />
                ))}
                {selected.streaming ? <StatusBadge label="streaming" tone="info" /> : null}
              </div>
            </div>
          ) : null}
          <Button
            onClick={() => run.mutate({ signalKey, datasetRef, params })}
            disabled={run.isPending}
            className="w-full"
          >
            {run.isPending ? 'Generating…' : 'Generate signal'}
          </Button>
        </div>
      </InfoCard>

      <div>
        {run.isError ? (
          <SigError onRetry={() => run.reset()} />
        ) : run.data ? (
          <ResultView result={run.data} />
        ) : (
          <p className="py-8 text-sm text-muted-foreground">
            Choose a signal and generate it to see the live result.
          </p>
        )}
      </div>
    </div>
  );
}
