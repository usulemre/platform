'use client';

import { useMetrics } from '../hooks/use-gateway';
import { Bar, InfoCard, KpiGrid, StatusBadge, GatewayLoading } from './gateway-atoms';

/** Gateway Metrics — fleet-level metrics: status/provider distribution and capability coverage. */
export function GatewayMetrics() {
  const { data, isLoading } = useMetrics();
  if (isLoading || !data) return <GatewayLoading rows={8} />;
  const maxProvider = Math.max(1, ...data.byProvider.map((p) => p.count));
  const maxCap = Math.max(1, ...data.capabilityCoverage.map((c) => c.count));
  return (
    <div className="space-y-4">
      <KpiGrid kpis={data.kpis} />
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="By status">
          <div className="space-y-2">
            {data.byStatus.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <StatusBadge label={s.label} tone={s.tone} />
                </span>
                <span className="font-mono text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </InfoCard>
        <InfoCard title="By provider">
          <div className="space-y-2">
            {data.byProvider.map((p) => (
              <div
                key={p.providerId}
                className="grid grid-cols-[10rem_1fr_2rem] items-center gap-3 text-sm"
              >
                <span className="truncate font-medium">{p.providerId}</span>
                <Bar pct={(p.count / maxProvider) * 100} />
                <span className="text-right font-mono text-muted-foreground">{p.count}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      </div>
      <InfoCard title="Capability coverage">
        <div className="space-y-2">
          {data.capabilityCoverage.map((c) => (
            <div
              key={c.label}
              className="grid grid-cols-[12rem_1fr_2rem] items-center gap-3 text-sm"
            >
              <span className="truncate">{c.label}</span>
              <Bar pct={(c.count / maxCap) * 100} tone="positive" />
              <span className="text-right font-mono text-muted-foreground">{c.count}</span>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}
