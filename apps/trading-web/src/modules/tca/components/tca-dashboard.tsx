'use client';

import Link from 'next/link';
import { useTcaSummary, useExecutions, useVenueComparison } from '../hooks/use-tca';
import { EngineNotice, InfoCard, KpiGrid, TcaLoading } from './tca-atoms';
import { ExecutionTable, VenueTable } from './tca-tables';

const SECTIONS: readonly {
  readonly href: string;
  readonly label: string;
  readonly hint: string;
}[] = [
  { href: '/tca/quality', label: 'Execution quality', hint: 'Scores, grades and efficiency' },
  { href: '/tca/slippage', label: 'Slippage', hint: 'Benchmark slippage analytics' },
  { href: '/tca/impact', label: 'Market impact', hint: 'Permanent / temporary decomposition' },
  { href: '/tca/benchmarks', label: 'Benchmarks', hint: 'Eight-benchmark comparison' },
  { href: '/tca/venues', label: 'Venues', hint: 'Per-venue cost comparison' },
  { href: '/tca/reports', label: 'Cost reports', hint: 'Grouped cost roll-ups' },
];

function Summary() {
  const { data, isLoading } = useTcaSummary();
  if (isLoading || !data) return <TcaLoading rows={2} />;
  return <KpiGrid kpis={data.kpis} />;
}

function RecentExecutions() {
  const { data, isLoading } = useExecutions({ sortBy: 'executedAt', sortDir: 'desc' });
  if (isLoading || !data) return <TcaLoading />;
  return (
    <InfoCard
      title="Recent executions"
      action={
        <Link href="/tca/explorer" className="text-sm underline-offset-2 hover:underline">
          Open explorer
        </Link>
      }
    >
      <ExecutionTable rows={data.slice(0, 8)} />
    </InfoCard>
  );
}

function VenueSummary() {
  const { data, isLoading } = useVenueComparison();
  if (isLoading || !data) return <TcaLoading rows={4} />;
  return (
    <InfoCard
      title="Venue cost comparison"
      action={
        <Link href="/tca/venues" className="text-sm underline-offset-2 hover:underline">
          All venues
        </Link>
      }
    >
      <VenueTable rows={data} />
    </InfoCard>
  );
}

/** TCA Dashboard — the execution-cost landing view: KPIs, recent executions, venue comparison, links. */
export function TcaDashboard() {
  return (
    <div className="space-y-4">
      <EngineNotice />
      <Summary />
      <div className="grid gap-4 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <InfoCard key={section.href} title={section.label}>
            <p className="text-sm text-muted-foreground">{section.hint}</p>
            <Link
              href={section.href}
              className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Open {section.label.toLowerCase()}
            </Link>
          </InfoCard>
        ))}
      </div>
      <RecentExecutions />
      <VenueSummary />
    </div>
  );
}
