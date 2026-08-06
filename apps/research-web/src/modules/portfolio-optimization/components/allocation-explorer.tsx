'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@platform/ui';
import type { OptimizerKey } from '@platform/portfolio-optimization-sdk';
import { useOptimize, useOptimizers, useUniverses } from '../hooks/use-portfolio-optimization';
import { useConstraintStore } from '../domain/constraint-store';
import type { OptimizationResultVm, OptimizerVm } from '../domain/view-model';
import {
  InfoCard,
  OptError,
  OptLoading,
  StatusBadge,
  WeightBar,
  selectClass,
} from './portfolio-optimization-atoms';

function ResultView({ result }: { result: OptimizationResultVm }) {
  const maxWeight = useMemo(
    () => result.allocations.reduce((m, a) => Math.max(m, Math.abs(a.weightRaw)), 0) || 1,
    [result.allocations],
  );
  const metrics = result.metrics;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">{result.label}</h3>
        <StatusBadge
          label={result.validationPassed ? 'Validated' : 'Validation failed'}
          tone={result.validationPassed ? 'positive' : 'danger'}
        />
        <StatusBadge
          label={
            result.converged
              ? `converged (${result.iterations} it)`
              : `not converged (${result.iterations} it)`
          }
          tone={result.converged ? 'info' : 'warning'}
        />
        <span className="text-xs text-muted-foreground">
          {result.paramSummary} · {result.durationMs}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Exp. return</p>
          <p className="text-base font-semibold">{metrics.expectedReturn}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Volatility</p>
          <p className="text-base font-semibold">{metrics.volatility}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Sharpe</p>
          <p className="text-base font-semibold">{metrics.sharpe}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Diversif.</p>
          <p className="text-base font-semibold">{metrics.diversificationRatio}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Eff. assets</p>
          <p className="text-base font-semibold">{metrics.effectiveAssets}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Cash</p>
          <p className="text-base font-semibold">{result.cashWeightPct}</p>
        </div>
      </div>

      <InfoCard title="Allocations">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Asset</th>
                <th className="px-3 py-1.5 text-left font-medium">Sector</th>
                <th className="px-3 py-1.5 text-left font-medium">Weight</th>
                <th className="px-3 py-1.5 text-right font-medium">Weight %</th>
                <th className="px-3 py-1.5 text-right font-medium">Risk contrib.</th>
              </tr>
            </thead>
            <tbody>
              {result.allocations.map((allocation) => (
                <tr key={allocation.asset} className="border-t">
                  <td className="px-3 py-1 font-medium">{allocation.asset}</td>
                  <td className="px-3 py-1 text-xs text-muted-foreground">{allocation.sector}</td>
                  <td className="px-3 py-1">
                    <WeightBar fraction={Math.abs(allocation.weightRaw) / maxWeight} />
                  </td>
                  <td className="px-3 py-1 text-right font-mono">{allocation.weightPct}</td>
                  <td className="px-3 py-1 text-right font-mono text-muted-foreground">
                    {allocation.riskContributionPct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoCard>

      <InfoCard title="Validation & constraints">
        <ul className="space-y-1 text-sm">
          {[...result.checks, ...result.constraintChecks].map((check) => (
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
    </div>
  );
}

/** Allocation Explorer — pick a method, universe and parameters, then optimize live under the shared constraints. */
export function AllocationExplorer() {
  const optimizers = useOptimizers();
  const universes = useUniverses();
  const optimize = useOptimize();
  const constraints = useConstraintStore((state) => state.constraints);

  const flat = useMemo<OptimizerVm[]>(
    () => (optimizers.data ?? []).flatMap((group) => group.optimizers),
    [optimizers.data],
  );
  const [optimizerKey, setOptimizerKey] = useState<OptimizerKey>('minimum_variance');
  const [universeRef, setUniverseRef] = useState('univ-equity-10');
  const [params, setParams] = useState<Record<string, number>>({});

  const selected = flat.find((optimizer) => optimizer.key === optimizerKey);

  if (optimizers.isLoading || universes.isLoading) return <OptLoading />;
  if (optimizers.isError) return <OptError onRetry={() => optimizers.refetch()} />;

  const paramValue = (name: string, fallback: number): number => params[name] ?? fallback;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <InfoCard title="Optimizer">
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Method</span>
            <select
              aria-label="Method"
              className={`${selectClass} mt-1 w-full`}
              value={optimizerKey}
              onChange={(event) => {
                setOptimizerKey(event.target.value as OptimizerKey);
                setParams({});
              }}
            >
              {(optimizers.data ?? []).map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.optimizers.map((optimizer) => (
                    <option key={optimizer.key} value={optimizer.key}>
                      {optimizer.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Universe</span>
            <select
              aria-label="Universe"
              className={`${selectClass} mt-1 w-full`}
              value={universeRef}
              onChange={(event) => setUniverseRef(event.target.value)}
            >
              {(universes.data ?? []).map((universe) => (
                <option key={universe.ref} value={universe.ref}>
                  {universe.label} ({universe.assets} assets)
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
            <p className="text-xs text-muted-foreground">{selected.description}</p>
          ) : null}
          <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Active constraints</p>
            <p>
              {constraints.longOnly ? 'Long only' : 'Long/short'} · max{' '}
              {(constraints.maxWeight * 100).toFixed(0)}% · leverage {constraints.maxLeverage} ·
              cash {(constraints.cashReserve * 100).toFixed(0)}%
            </p>
            <Link
              href="/portfolio-optimization/constraints"
              className="mt-1 inline-block underline"
            >
              Edit constraints
            </Link>
          </div>
          <Button
            onClick={() => optimize.mutate({ optimizerKey, universeRef, params, constraints })}
            disabled={optimize.isPending}
            className="w-full"
          >
            {optimize.isPending ? 'Optimizing…' : 'Optimize'}
          </Button>
        </div>
      </InfoCard>

      <div>
        {optimize.isError ? (
          <OptError onRetry={() => optimize.reset()} />
        ) : optimize.data ? (
          <ResultView result={optimize.data} />
        ) : (
          <p className="py-8 text-sm text-muted-foreground">
            Choose a method and optimize to see the live allocation.
          </p>
        )}
      </div>
    </div>
  );
}
