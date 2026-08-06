'use client';

import { useActiveExperiments, useRecent } from '../hooks/use-workspace';
import type { WorkspaceItemKindDto } from '../domain/dto';
import { InfoCard, ItemList } from './workspace-atoms';

function RecentPanel({ kind, title }: { kind: WorkspaceItemKindDto; title: string }) {
  const query = useRecent(kind);
  return (
    <InfoCard title={title}>
      <ItemList query={query} emptyLabel="Nothing recent." />
    </InfoCard>
  );
}

export function RecentDatasets() {
  return <RecentPanel kind="DATASET" title="Recent datasets" />;
}

export function RecentFeatures() {
  return <RecentPanel kind="FEATURE" title="Recent features" />;
}

export function RecentSignals() {
  return <RecentPanel kind="SIGNAL" title="Recent signals" />;
}

export function RecentStrategies() {
  return <RecentPanel kind="STRATEGY" title="Recent strategies" />;
}

export function RecentPortfolios() {
  return <RecentPanel kind="PORTFOLIO" title="Recent portfolios" />;
}

/** Active Experiments panel — highlights in-flight research. */
export function ActiveExperiments() {
  const query = useActiveExperiments();
  return (
    <InfoCard title="Active experiments">
      <ItemList query={query} emptyLabel="No active experiments." />
    </InfoCard>
  );
}
