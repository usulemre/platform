'use client';

import { useTcaMetrics, useSlippageRows, useCommissionRows, useImpactRows } from '../hooks/use-tca';
import { InfoCard, ShareBar, StatCard, TcaLoading, ToneText } from './tca-atoms';
import { CommissionTable, ImpactTable, SlippageTable } from './tca-tables';

/** Slippage Analytics — per-benchmark average slippage and the per-execution slippage matrix. */
export function SlippageAnalytics() {
  const metrics = useTcaMetrics();
  const rows = useSlippageRows({ sortBy: 'executedAt', sortDir: 'desc' });
  if (metrics.isLoading || !metrics.data || rows.isLoading || !rows.data)
    return <TcaLoading rows={8} />;
  return (
    <div className="space-y-4">
      <InfoCard title="Average slippage by benchmark">
        <div className="space-y-3">
          {metrics.data.benchmarkAverages.map((b) => (
            <div
              key={b.type}
              className="grid grid-cols-[10rem_1fr_6rem] items-center gap-3 text-sm"
            >
              <span className="font-medium">{b.label}</span>
              <ShareBar pct={b.favorablePct} tone={b.slippageTone} />
              <ToneText value={b.avgSlippageBps} tone={b.slippageTone} />
            </div>
          ))}
        </div>
      </InfoCard>
      <InfoCard title="Slippage by execution">
        <SlippageTable rows={rows.data} />
      </InfoCard>
    </div>
  );
}

/** Commission Analytics — explicit-cost KPIs and the per-execution commission table. */
export function CommissionAnalytics() {
  const metrics = useTcaMetrics();
  const rows = useCommissionRows();
  if (metrics.isLoading || !metrics.data || rows.isLoading || !rows.data)
    return <TcaLoading rows={8} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Executions" value={metrics.data.totals.executions} />
        <StatCard label="Total cost" value={metrics.data.totals.totalCostCurrency} />
        <StatCard
          label="Avg commission"
          value={metrics.data.byVenue.length ? metrics.data.byVenue[0]!.avgCommissionBps : '—'}
        />
        <StatCard label="Avg total cost" value={metrics.data.totals.avgTotalCostBps} />
      </div>
      <InfoCard title="Commission by execution">
        <CommissionTable rows={rows.data} />
      </InfoCard>
    </div>
  );
}

/** Market Impact Analytics — the permanent/temporary decomposition and spread microstructure. */
export function MarketImpactAnalytics() {
  const rows = useImpactRows();
  if (rows.isLoading || !rows.data) return <TcaLoading rows={8} />;
  return (
    <div className="space-y-4">
      <InfoCard title="Market impact decomposition">
        <p className="mb-3 text-sm text-muted-foreground">
          Total impact against the arrival price splits, additively, into a permanent (information)
          component and a temporary (liquidity) component. Effective and realized spread describe
          the round-trip liquidity cost.
        </p>
        <ImpactTable rows={rows.data} />
      </InfoCard>
    </div>
  );
}
