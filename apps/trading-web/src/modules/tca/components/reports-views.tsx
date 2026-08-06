'use client';

import { useState } from 'react';
import type { ReportGroupBy, ScorecardDimension } from '../application/tca-view-service';
import { useAttributionSummary, useCostReport, useScorecards } from '../hooks/use-tca';
import {
  ChipBadge,
  InfoCard,
  KpiGrid,
  ShareBar,
  StatusBadge,
  TcaEmpty,
  TcaLoading,
  ToneText,
} from './tca-atoms';

const GROUPS: readonly ReportGroupBy[] = ['VENUE', 'SYMBOL', 'SIDE', 'MODE'];
const DIMENSIONS: readonly ScorecardDimension[] = ['VENUE', 'SYMBOL', 'MODE'];

function Tabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-md border px-3 py-1 text-sm ${value === option ? 'bg-accent font-medium' : 'hover:bg-accent/50'}`}
        >
          {option.charAt(0) + option.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}

/** Cost Reports — grouped cost roll-ups (by venue / symbol / side / mode) with a portfolio total. */
export function CostReports() {
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('VENUE');
  const { data, isLoading } = useCostReport(groupBy);
  return (
    <div className="space-y-4">
      <Tabs options={GROUPS} value={groupBy} onChange={setGroupBy} />
      {isLoading || !data ? (
        <TcaLoading rows={8} />
      ) : (
        <>
          <KpiGrid kpis={data.totals.kpis} />
          <InfoCard title={`Cost by ${data.groupBy.toLowerCase()}`}>
            {data.rows.length === 0 ? (
              <TcaEmpty label="No executions." />
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium">{data.groupBy}</th>
                      <th className="px-3 py-1.5 text-right font-medium">Executions</th>
                      <th className="px-3 py-1.5 text-right font-medium">Notional</th>
                      <th className="px-3 py-1.5 text-right font-medium">Total cost</th>
                      <th className="px-3 py-1.5 text-right font-medium">Slippage</th>
                      <th className="px-3 py-1.5 text-right font-medium">Spread</th>
                      <th className="px-3 py-1.5 text-right font-medium">Impact</th>
                      <th className="px-3 py-1.5 text-right font-medium">Commission</th>
                      <th className="px-3 py-1.5 text-right font-medium">Impl. shortfall</th>
                      <th className="px-3 py-1.5 text-right font-medium">Avg cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.key} className="border-t hover:bg-accent/40">
                        <td className="px-3 py-1 font-medium">{row.key}</td>
                        <td className="px-3 py-1 text-right font-mono">{row.executions}</td>
                        <td className="px-3 py-1 text-right font-mono">{row.totalNotional}</td>
                        <td className="px-3 py-1 text-right font-mono">{row.totalCostCurrency}</td>
                        <td className="px-3 py-1 text-right font-mono">{row.avgSlippageBps}</td>
                        <td className="px-3 py-1 text-right font-mono">{row.avgSpreadBps}</td>
                        <td className="px-3 py-1 text-right font-mono">{row.avgMarketImpactBps}</td>
                        <td className="px-3 py-1 text-right font-mono">{row.avgCommissionBps}</td>
                        <td className="px-3 py-1 text-right font-mono">
                          {row.avgImplementationShortfallBps}
                        </td>
                        <td className="px-3 py-1 text-right">
                          <ToneText value={row.avgTotalCostBps} tone={row.avgTotalCostTone} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </InfoCard>
        </>
      )}
    </div>
  );
}

/** Cost Attribution — the additive decomposition of the portfolio's average cost into buckets. */
export function CostAttribution() {
  const { data, isLoading } = useAttributionSummary();
  if (isLoading || !data) return <TcaLoading rows={6} />;
  return (
    <div className="space-y-4">
      <InfoCard title="Cost attribution">
        <p className="mb-4 text-sm text-muted-foreground">
          Average total cost <ToneText value={data.totalBps} tone={data.totalTone} /> (
          {data.totalCurrency}) decomposes additively into timing slippage, spread, permanent market
          impact and commission.
        </p>
        <div className="space-y-3">
          {data.components.map((c) => (
            <div
              key={c.label}
              className="grid grid-cols-[9rem_1fr_5rem_4rem] items-center gap-3 text-sm"
            >
              <span className="font-medium">{c.label}</span>
              <ShareBar pct={c.sharePct} tone={c.tone} />
              <ToneText value={c.bps} tone={c.tone} />
              <span className="text-right font-mono text-muted-foreground">{c.share}</span>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}

/** Execution Scorecards — quality scorecards grouped by venue / symbol / mode, best score first. */
export function ExecutionScorecards() {
  const [dimension, setDimension] = useState<ScorecardDimension>('VENUE');
  const { data, isLoading } = useScorecards(dimension);
  return (
    <div className="space-y-4">
      <Tabs options={DIMENSIONS} value={dimension} onChange={setDimension} />
      {isLoading || !data ? (
        <TcaLoading rows={6} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((card) => (
            <InfoCard key={card.key} title={card.key} action={<ChipBadge chip={card.grade} />}>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Avg score</dt>
                  <dd className="font-mono text-lg">{card.avgScore}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Executions</dt>
                  <dd className="font-mono text-lg">{card.executions}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Best / worst</dt>
                  <dd className="font-mono">
                    {card.bestScore} / {card.worstScore}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Favorable</dt>
                  <dd className="font-mono">{card.favorableRate}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Avg cost</dt>
                  <dd className="font-mono">{card.avgTotalCostBps}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Avg slippage</dt>
                  <dd className="font-mono">{card.avgSlippageBps}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1">
                {card.gradeDistribution.map((g) => (
                  <span key={g.grade} className="inline-flex items-center gap-1">
                    <StatusBadge label={g.grade} tone={g.tone} />
                    <span className="text-xs text-muted-foreground">{g.count}</span>
                  </span>
                ))}
              </div>
            </InfoCard>
          ))}
        </div>
      )}
    </div>
  );
}
