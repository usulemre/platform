'use client';

import { useMemo, useState } from 'react';
import { Button, Input } from '@platform/ui';
import { useCalculations, useDatasets, useRunCalculation } from '../hooks/use-feature-calculation';
import type { CalculationResultVm, CalculationVm } from '../domain/view-model';
import type { FeatureKey } from '@platform/feature-calculation-sdk';
import {
  CalcError,
  CalcLoading,
  InfoCard,
  StatusBadge,
  selectClass,
} from './feature-calculation-atoms';

function ResultView({ result }: { result: CalculationResultVm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">{result.label}</h3>
        <StatusBadge
          label={result.validationPassed ? 'Validated' : 'Validation failed'}
          tone={result.validationPassed ? 'positive' : 'danger'}
        />
        <span className="text-xs text-muted-foreground">
          {result.paramSummary} · {result.durationMs}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Length</p>
          <p className="text-lg font-semibold">{result.length}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Warm-up</p>
          <p className="text-lg font-semibold">{result.warmup}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Finite</p>
          <p className="text-lg font-semibold">{result.finiteRatio}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Outputs</p>
          <p className="text-lg font-semibold">{result.outputKeys.length}</p>
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

      <InfoCard title="Output preview (last values)">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Index</th>
                <th className="px-3 py-1.5 text-left font-medium">Date</th>
                <th className="px-3 py-1.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {result.preview.map((point) => (
                <tr key={point.index} className="border-t">
                  <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                    {point.index}
                  </td>
                  <td className="px-3 py-1 text-muted-foreground">{point.timeLabel}</td>
                  <td className="px-3 py-1 text-right font-mono">{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.dependsOn.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Depends on: {result.dependsOn.join(', ')}
          </p>
        ) : null}
        <p role="note" className="mt-2 text-xs text-muted-foreground">
          Values are computed live by the calculation library (real algorithm), then validated for
          determinism and point-in-time causality.
        </p>
      </InfoCard>
    </div>
  );
}

/** Calculation Explorer — select a real calculation, dataset and parameters, then run it live. */
export function CalculationExplorer() {
  const calculations = useCalculations();
  const datasets = useDatasets();
  const run = useRunCalculation();

  const flat = useMemo<CalculationVm[]>(
    () => (calculations.data ?? []).flatMap((group) => group.calculations),
    [calculations.data],
  );
  const [featureKey, setFeatureKey] = useState<FeatureKey>('sma');
  const [datasetRef, setDatasetRef] = useState('ds-equity-eod');
  const [params, setParams] = useState<Record<string, number>>({});

  const selected = flat.find((calc) => calc.key === featureKey);

  if (calculations.isLoading || datasets.isLoading) return <CalcLoading />;
  if (calculations.isError) return <CalcError onRetry={() => calculations.refetch()} />;

  const onSelectFeature = (key: FeatureKey) => {
    setFeatureKey(key);
    setParams({});
  };

  const paramValue = (name: string, fallback: number): number => params[name] ?? fallback;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <InfoCard title="Calculation">
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Feature</span>
            <select
              aria-label="Feature"
              className={`${selectClass} mt-1 w-full`}
              value={featureKey}
              onChange={(event) => onSelectFeature(event.target.value as FeatureKey)}
            >
              {(calculations.data ?? []).map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.calculations.map((calc) => (
                    <option key={calc.key} value={calc.key}>
                      {calc.label}
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
            onClick={() => run.mutate({ featureKey, datasetRef, params })}
            disabled={run.isPending}
            className="w-full"
          >
            {run.isPending ? 'Computing…' : 'Run calculation'}
          </Button>
        </div>
      </InfoCard>

      <div>
        {run.isError ? (
          <CalcError onRetry={() => run.reset()} />
        ) : run.data ? (
          <ResultView result={run.data} />
        ) : (
          <p className="py-8 text-sm text-muted-foreground">
            Choose a calculation and run it to see the live result.
          </p>
        )}
      </div>
    </div>
  );
}
