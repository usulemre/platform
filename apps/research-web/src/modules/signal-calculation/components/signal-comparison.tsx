'use client';

import { useMemo, useState } from 'react';
import { Button } from '@platform/ui';
import type { SignalKey } from '@platform/signal-calculation-sdk';
import { useCompareSignals, useDatasets, useSignals } from '../hooks/use-signal-calculation';
import type { SignalVm } from '../domain/view-model';
import { InfoCard, SigError, SigLoading, selectClass } from './signal-calculation-atoms';

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

/** Signal Comparison — measure agreement and correlation between two signals over a dataset. */
export function SignalComparison() {
  const signals = useSignals();
  const datasets = useDatasets();
  const compare = useCompareSignals();

  const flat = useMemo<SignalVm[]>(
    () => (signals.data ?? []).flatMap((group) => group.signals),
    [signals.data],
  );
  const [signalA, setSignalA] = useState<SignalKey>('ma_crossover');
  const [signalB, setSignalB] = useState<SignalKey>('ema_crossover');
  const [datasetRef, setDatasetRef] = useState('ds-equity-eod');

  if (signals.isLoading || datasets.isLoading) return <SigLoading />;
  if (signals.isError) return <SigError onRetry={() => signals.refetch()} />;

  const pick = (value: SignalKey, onChange: (key: SignalKey) => void, label: string) => (
    <label className="block text-sm">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <select
        aria-label={label}
        className={`${selectClass} mt-1`}
        value={value}
        onChange={(event) => onChange(event.target.value as SignalKey)}
      >
        {flat.map((sig) => (
          <option key={sig.key} value={sig.key}>
            {sig.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {pick(signalA, setSignalA, 'Signal A')}
        {pick(signalB, setSignalB, 'Signal B')}
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
          onClick={() => compare.mutate({ datasetRef, signalA, signalB })}
          disabled={compare.isPending}
        >
          {compare.isPending ? 'Comparing…' : 'Compare'}
        </Button>
      </div>

      {compare.isError ? (
        <SigError onRetry={() => compare.reset()} />
      ) : compare.data ? (
        <InfoCard title={`${compare.data.signalALabel} vs ${compare.data.signalBLabel}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Compared bars" value={compare.data.comparedBars} />
            <Metric label="Agreement" value={compare.data.agreementRatio} />
            <Metric label="Correlation" value={compare.data.correlation} />
            <Metric label="Both long" value={compare.data.bothLong} />
            <Metric label="Both short" value={compare.data.bothShort} />
            <Metric label="Opposite" value={compare.data.opposite} />
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Agreement is the fraction of bars where both signals are finite and equal; correlation
            is the Pearson correlation of the two direction series. Real signals, computed live.
          </p>
        </InfoCard>
      ) : (
        <p className="py-8 text-sm text-muted-foreground">
          Choose two signals and a dataset to compare their agreement and correlation.
        </p>
      )}
    </div>
  );
}
