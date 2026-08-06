'use client';

import { useMemo, useState } from 'react';
import { Button } from '@platform/ui';
import type { OptimizerKey } from '@platform/portfolio-optimization-sdk';
import {
  useCompareOptimizers,
  useOptimizers,
  useUniverses,
} from '../hooks/use-portfolio-optimization';
import { useConstraintStore } from '../domain/constraint-store';
import type { OptimizerVm } from '../domain/view-model';
import {
  InfoCard,
  OptError,
  OptLoading,
  StatusBadge,
  selectClass,
} from './portfolio-optimization-atoms';

const DEFAULT_SELECTION: OptimizerKey[] = [
  'equal_weight',
  'minimum_variance',
  'risk_parity',
  'maximum_sharpe',
  'maximum_diversification',
];

/** Portfolio Comparison — compare optimizers' metrics over the same universe and constraints. */
export function PortfolioComparison() {
  const optimizers = useOptimizers();
  const universes = useUniverses();
  const compare = useCompareOptimizers();
  const constraints = useConstraintStore((state) => state.constraints);

  const flat = useMemo<OptimizerVm[]>(
    () => (optimizers.data ?? []).flatMap((group) => group.optimizers),
    [optimizers.data],
  );
  const [universeRef, setUniverseRef] = useState('univ-equity-10');
  const [selected, setSelected] = useState<OptimizerKey[]>(DEFAULT_SELECTION);

  if (optimizers.isLoading || universes.isLoading) return <OptLoading />;
  if (optimizers.isError) return <OptError onRetry={() => optimizers.refetch()} />;

  const toggle = (key: OptimizerKey) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">Universe</span>
          <select
            aria-label="Universe"
            className={`${selectClass} mt-1`}
            value={universeRef}
            onChange={(event) => setUniverseRef(event.target.value)}
          >
            {(universes.data ?? []).map((universe) => (
              <option key={universe.ref} value={universe.ref}>
                {universe.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          onClick={() => compare.mutate({ universeRef, keys: selected, constraints })}
          disabled={compare.isPending || selected.length === 0}
        >
          {compare.isPending ? 'Comparing…' : `Compare ${selected.length}`}
        </Button>
      </div>

      <InfoCard title="Methods">
        <div className="flex flex-wrap gap-2">
          {flat.map((optimizer) => (
            <label
              key={optimizer.key}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-sm ${selected.includes(optimizer.key as OptimizerKey) ? 'border-primary bg-primary/10' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected.includes(optimizer.key as OptimizerKey)}
                onChange={() => toggle(optimizer.key as OptimizerKey)}
              />
              <span>{optimizer.label}</span>
            </label>
          ))}
        </div>
      </InfoCard>

      {compare.isError ? (
        <OptError onRetry={() => compare.reset()} />
      ) : compare.data ? (
        <InfoCard title="Comparison">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">Method</th>
                  <th className="px-3 py-1.5 text-right font-medium">Exp. return</th>
                  <th className="px-3 py-1.5 text-right font-medium">Volatility</th>
                  <th className="px-3 py-1.5 text-right font-medium">Sharpe</th>
                  <th className="px-3 py-1.5 text-right font-medium">Diversif.</th>
                  <th className="px-3 py-1.5 text-right font-medium">Eff. assets</th>
                  <th className="px-3 py-1.5 text-right font-medium">Max wt</th>
                  <th className="px-3 py-1.5 text-right font-medium">Valid</th>
                </tr>
              </thead>
              <tbody>
                {compare.data.map((row) => (
                  <tr key={row.optimizerKey} className="border-t">
                    <td className="px-3 py-1 font-medium">{row.label}</td>
                    <td className="px-3 py-1 text-right font-mono">{row.expectedReturn}</td>
                    <td className="px-3 py-1 text-right font-mono">{row.volatility}</td>
                    <td className="px-3 py-1 text-right font-mono">{row.sharpe}</td>
                    <td className="px-3 py-1 text-right font-mono">{row.diversificationRatio}</td>
                    <td className="px-3 py-1 text-right font-mono">{row.effectiveAssets}</td>
                    <td className="px-3 py-1 text-right font-mono">{row.maxWeight}</td>
                    <td className="px-3 py-1 text-right">
                      <StatusBadge
                        label={row.validationPassed ? 'Pass' : 'Fail'}
                        tone={row.validationPassed ? 'positive' : 'danger'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Every row is a real optimization over the same estimated returns/covariance and the same
            constraints — computed live.
          </p>
        </InfoCard>
      ) : (
        <p className="py-8 text-sm text-muted-foreground">
          Pick methods and a universe, then compare.
        </p>
      )}
    </div>
  );
}
