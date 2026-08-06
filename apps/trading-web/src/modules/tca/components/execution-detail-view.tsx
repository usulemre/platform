'use client';

import Link from 'next/link';
import { useExecutionDetail } from '../hooks/use-tca';
import {
  ChipBadge,
  InfoCard,
  KpiGrid,
  ShareBar,
  TcaError,
  TcaLoading,
  ToneText,
} from './tca-atoms';
import { BenchmarkTable } from './tca-tables';

/** Execution detail — the full TCA breakdown for one execution: KPIs, benchmarks, cost attribution,
 *  market impact and slippage. All figures are real `@platform/tca-sdk` calculations. */
export function ExecutionDetailView({ id }: { id: string }) {
  const { data, isLoading, isError } = useExecutionDetail(id);
  if (isLoading) return <TcaLoading rows={8} />;
  if (isError) return <TcaError />;
  if (!data) return <p className="py-6 text-sm text-muted-foreground">Execution {id} not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/tca/explorer" className="text-sm underline-offset-2 hover:underline">
          ← Explorer
        </Link>
        <span className="font-mono text-sm">{data.id}</span>
        <span className="font-medium">{data.symbol}</span>
        <ChipBadge chip={data.side} />
        <ChipBadge chip={data.mode} />
        <span className="text-sm text-muted-foreground">
          {data.venue} · {data.executedAtLabel}
        </span>
      </div>
      <KpiGrid kpis={data.kpis} />
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Execution facts">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {data.meta.map((row) => (
              <div key={row.label}>
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-mono">{row.value}</dd>
              </div>
            ))}
          </dl>
        </InfoCard>
        <InfoCard title="Cost attribution">
          <p className="mb-3 text-sm">
            Total <ToneText value={data.cost.totalBps} tone={data.cost.totalTone} /> (
            {data.cost.totalCurrency})
          </p>
          <div className="space-y-3">
            {data.attribution.components.map((c) => (
              <div
                key={c.label}
                className="grid grid-cols-[8rem_1fr_5rem] items-center gap-3 text-sm"
              >
                <span>{c.label}</span>
                <ShareBar pct={c.sharePct} tone={c.tone} />
                <ToneText value={c.bps} tone={c.tone} />
              </div>
            ))}
          </div>
        </InfoCard>
      </div>
      <InfoCard title="Benchmark comparison">
        <BenchmarkTable rows={data.benchmarks} />
      </InfoCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Market impact">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Total impact</dt>
              <dd>
                <ToneText value={data.impact.totalBps} tone={data.impact.totalTone} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Permanent</dt>
              <dd className="font-mono">{data.impact.permanentBps}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Temporary</dt>
              <dd className="font-mono">{data.impact.temporaryBps}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Effective spread</dt>
              <dd className="font-mono">{data.impact.effectiveSpreadBps}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Realized spread</dt>
              <dd className="font-mono">{data.impact.realizedSpreadBps}</dd>
            </div>
          </dl>
        </InfoCard>
        <InfoCard title="Slippage">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">vs Arrival</dt>
              <dd>
                <ToneText value={data.slippage.vsArrival} tone={data.slippage.vsArrivalTone} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">vs VWAP</dt>
              <dd className="font-mono">{data.slippage.vsVwap}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">vs TWAP</dt>
              <dd className="font-mono">{data.slippage.vsTwap}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">vs Decision</dt>
              <dd className="font-mono">{data.slippage.vsDecision}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">vs Mid</dt>
              <dd className="font-mono">{data.slippage.vsMid}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">vs Close</dt>
              <dd className="font-mono">{data.slippage.vsClose}</dd>
            </div>
          </dl>
        </InfoCard>
      </div>
    </div>
  );
}
