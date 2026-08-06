'use client';

import { useMemo, useState } from 'react';
import { Button } from '@platform/ui';
import { useEfficientFrontier, useUniverses } from '../hooks/use-portfolio-optimization';
import { useConstraintStore } from '../domain/constraint-store';
import type { FrontierPointVm } from '../domain/view-model';
import {
  InfoCard,
  OptError,
  OptLoading,
  StatusBadge,
  selectClass,
} from './portfolio-optimization-atoms';

/** A compact SVG scatter of the frontier (risk on x, return on y); the max-Sharpe point is filled. */
function FrontierPlot({ points }: { points: readonly FrontierPointVm[] }) {
  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.volatility);
      maxX = Math.max(maxX, p.volatility);
      minY = Math.min(minY, p.expectedReturn);
      maxY = Math.max(maxY, p.expectedReturn);
    }
    return { minX, maxX, minY, maxY };
  }, [points]);
  if (points.length === 0) return null;
  const spanX = bounds.maxX - bounds.minX || 1;
  const spanY = bounds.maxY - bounds.minY || 1;
  const x = (v: number) => 6 + ((v - bounds.minX) / spanX) * 88;
  const y = (v: number) => 54 - ((v - bounds.minY) / spanY) * 48;
  return (
    <svg
      viewBox="0 0 100 60"
      className="h-48 w-full rounded-md border bg-muted/20"
      role="img"
      aria-label="Efficient frontier"
    >
      <polyline
        points={points.map((p) => `${x(p.volatility)},${y(p.expectedReturn)}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        className="text-muted-foreground"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(p.volatility)}
          cy={y(p.expectedReturn)}
          r={p.isMaxSharpe ? 1.6 : 0.9}
          className={p.isMaxSharpe ? 'fill-primary' : 'fill-muted-foreground'}
        />
      ))}
    </svg>
  );
}

/** Efficient Frontier — compute the mean-variance frontier over a universe under the shared constraints. */
export function EfficientFrontier() {
  const universes = useUniverses();
  const frontier = useEfficientFrontier();
  const constraints = useConstraintStore((state) => state.constraints);
  const [universeRef, setUniverseRef] = useState('univ-equity-10');

  if (universes.isLoading) return <OptLoading />;
  if (universes.isError) return <OptError onRetry={() => universes.refetch()} />;

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
          onClick={() => frontier.mutate({ universeRef, constraints, points: 24 })}
          disabled={frontier.isPending}
        >
          {frontier.isPending ? 'Computing…' : 'Compute frontier'}
        </Button>
      </div>

      {frontier.isError ? (
        <OptError onRetry={() => frontier.reset()} />
      ) : frontier.data ? (
        <InfoCard title="Efficient frontier">
          <FrontierPlot points={frontier.data} />
          <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-right font-medium">λ</th>
                  <th className="px-3 py-1.5 text-right font-medium">Volatility</th>
                  <th className="px-3 py-1.5 text-right font-medium">Exp. return</th>
                  <th className="px-3 py-1.5 text-right font-medium">Sharpe</th>
                  <th className="px-3 py-1.5 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {frontier.data.map((point, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-1 text-right font-mono text-muted-foreground">
                      {point.riskAversion}
                    </td>
                    <td className="px-3 py-1 text-right font-mono">{point.volatilityLabel}</td>
                    <td className="px-3 py-1 text-right font-mono">{point.expectedReturnLabel}</td>
                    <td className="px-3 py-1 text-right font-mono">{point.sharpe}</td>
                    <td className="px-3 py-1">
                      {point.isMaxSharpe ? (
                        <StatusBadge label="max Sharpe" tone="positive" />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Each point is a real constrained mean-variance solution at a different risk-aversion λ.
            The filled point maximizes the Sharpe ratio (the tangency portfolio).
          </p>
        </InfoCard>
      ) : (
        <p className="py-8 text-sm text-muted-foreground">
          Choose a universe and compute the efficient frontier.
        </p>
      )}
    </div>
  );
}
