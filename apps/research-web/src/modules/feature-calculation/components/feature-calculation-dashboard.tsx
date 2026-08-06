'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useCalculationSummary, useDependencyGraph } from '../hooks/use-feature-calculation';
import { CalcLoading, EngineNotice, InfoCard, StatusBadge } from './feature-calculation-atoms';

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
  const { data, isLoading } = useCalculationSummary();
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
        <StatCard label="Calculations" value={data.totalCalculations} />
        <StatCard label="Categories" value={data.categories} />
        <StatCard label="Streaming" value={data.streaming} />
        <StatCard label="Datasets" value={data.datasets} />
      </div>
      {data.byCategory.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Calculations by category
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
  if (isLoading || !data) return <CalcLoading rows={3} />;
  const withDeps = data.filter((node) => node.dependsOn.length > 0);
  return (
    <InfoCard title="Feature dependency graph">
      {withDeps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No dependencies.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {withDeps.map((node) => (
            <li
              key={node.featureKey}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-medium">{node.label}</span>{' '}
                <span className="text-xs text-muted-foreground">
                  depends on {node.dependsOn.join(', ')}
                </span>
              </span>
              <StatusBadge label={`level ${node.level}`} tone="info" />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-2 text-xs text-muted-foreground">
        The scheduler runs dependencies before dependents; executors are self-contained, so ordering
        never changes a result.
      </p>
    </InfoCard>
  );
}

/** Feature Calculation Dashboard — headline counts, category distribution, dependency graph and links. */
export function FeatureCalculationDashboard() {
  return (
    <div className="space-y-4">
      <EngineNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Calculation explorer">
          <p className="text-sm text-muted-foreground">Run any real calculation live.</p>
          <Link
            href="/feature-calculation/explorer"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open explorer
          </Link>
        </InfoCard>
        <InfoCard title="Benchmark">
          <p className="text-sm text-muted-foreground">Measure throughput per calculation.</p>
          <Link
            href="/feature-calculation/benchmark"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open benchmark
          </Link>
        </InfoCard>
        <InfoCard title="History">
          <p className="text-sm text-muted-foreground">Execution history & performance.</p>
          <Link
            href="/feature-calculation/history"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open history
          </Link>
        </InfoCard>
      </div>
      <DependencyGraphSection />
    </div>
  );
}
