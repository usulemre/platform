'use client';

import { useTcaMetrics, useExecutions } from '../hooks/use-tca';
import { InfoCard, KpiGrid, ShareBar, StatusBadge, TcaLoading } from './tca-atoms';
import { ExecutionTable } from './tca-tables';

/** Execution Quality Dashboard — quality KPIs, grade distribution and the per-execution scores. */
export function ExecutionQualityDashboard() {
  const metrics = useTcaMetrics();
  const executions = useExecutions({ sortBy: 'executedAt', sortDir: 'desc' });
  if (metrics.isLoading || !metrics.data || executions.isLoading || !executions.data)
    return <TcaLoading rows={8} />;
  const total = metrics.data.byGrade.reduce((n, g) => n + g.count, 0);
  return (
    <div className="space-y-4">
      <KpiGrid kpis={metrics.data.totals.kpis} />
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Grade distribution">
          <div className="space-y-3">
            {metrics.data.byGrade.map((g) => (
              <div key={g.grade} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2">
                    <StatusBadge label={`Grade ${g.grade}`} tone={g.tone} />
                  </span>
                  <span className="font-mono text-muted-foreground">{g.count}</span>
                </div>
                <ShareBar pct={total > 0 ? (g.count / total) * 100 : 0} tone={g.tone} />
              </div>
            ))}
          </div>
        </InfoCard>
        <InfoCard title="Quality summary">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Average score</dt>
              <dd className="font-mono text-lg">{metrics.data.totals.avgScore}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Favorable rate</dt>
              <dd className="font-mono text-lg">{metrics.data.totals.favorableRate}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Avg total cost</dt>
              <dd className="font-mono text-lg">{metrics.data.totals.avgTotalCostBps}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Avg slippage</dt>
              <dd className="font-mono text-lg">{metrics.data.totals.avgSlippageBps}</dd>
            </div>
          </dl>
        </InfoCard>
      </div>
      <InfoCard title="Execution scores">
        <ExecutionTable rows={executions.data} />
      </InfoCard>
    </div>
  );
}
