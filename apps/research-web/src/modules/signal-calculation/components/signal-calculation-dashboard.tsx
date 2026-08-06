'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useDependencyGraph, useSignalSummary } from '../hooks/use-signal-calculation';
import { EngineNotice, InfoCard, SigLoading, StatusBadge } from './signal-calculation-atoms';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummarySection() {
  const { data, isLoading } = useSignalSummary();
  if (isLoading || !data) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-busy="true"
        aria-label="Loading summary"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Signals" value={data.totalSignals} />
        <StatCard label="Categories" value={data.categories} />
        <StatCard label="Streaming" value={data.streaming} />
        <StatCard label="Datasets" value={data.datasets} />
      </div>
      {data.byCategory.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Signals by category
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {data.byCategory.map((bucket) => (
              <span key={bucket.category} className="inline-flex items-center gap-1">
                <StatusBadge label={bucket.category} tone="neutral" />
                <span className="text-sm text-muted-foreground">{bucket.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DependencyGraphSection() {
  const { data, isLoading } = useDependencyGraph();
  if (isLoading || !data) return <SigLoading rows={3} />;
  const withDeps = data.filter((node) => node.dependsOn.length > 0);
  return (
    <InfoCard title="Signal dependency graph">
      {withDeps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No composite dependencies.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {withDeps.map((node) => (
            <li
              key={node.signalKey}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-medium">{node.label}</span>{' '}
                <span className="text-xs text-muted-foreground">
                  combines {node.dependsOn.join(', ')}
                </span>
              </span>
              <StatusBadge label={`level ${node.level}`} tone="info" />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-2 text-xs text-muted-foreground">
        Composite signals depend on their base signals; every signal also consumes feature
        calculations from the Feature Calculation Engine. The scheduler runs dependencies first;
        executors are self-contained, so ordering never changes a result.
      </p>
    </InfoCard>
  );
}

/** Signal Calculation Dashboard — headline counts, category distribution, dependency graph and links. */
export function SignalCalculationDashboard() {
  return (
    <div className="space-y-4">
      <EngineNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Signal explorer">
          <p className="text-sm text-muted-foreground">Generate any real signal live.</p>
          <Link
            href="/signal-calculation/explorer"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open explorer
          </Link>
        </InfoCard>
        <InfoCard title="Debugger">
          <p className="text-sm text-muted-foreground">Inspect per-bar operands.</p>
          <Link
            href="/signal-calculation/debugger"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open debugger
          </Link>
        </InfoCard>
        <InfoCard title="Comparison">
          <p className="text-sm text-muted-foreground">Agreement & correlation of two signals.</p>
          <Link
            href="/signal-calculation/comparison"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open comparison
          </Link>
        </InfoCard>
      </div>
      <DependencyGraphSection />
    </div>
  );
}
