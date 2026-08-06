'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useFeature } from '../hooks/use-feature-store';
import {
  FeatureStoreEmpty,
  FeatureStoreError,
  FeatureStoreLoading,
  GovernanceNotice,
  StatusBadge,
} from './feature-store-atoms';
import {
  DefinitionPanel,
  DependenciesPanel,
  HealthPanel,
  LineagePanel,
  MetadataPanel,
  OwnershipPanel,
  QualityPanel,
  RegistrySyncPanel,
  SchemaPanel,
  TagsPanel,
  UsagePanel,
  VersionsPanel,
} from './panels';

/** Feature Details — the full record for one registered feature: definition,
 *  schema, versions, dependencies, lineage, ownership, usage, quality, health,
 *  validation status, registry synchronization, tags and metadata. */
export function FeatureDetailView({ featureId }: { featureId: string }) {
  const { data, isLoading, isError, refetch } = useFeature(featureId);

  if (isLoading) return <FeatureStoreLoading />;
  if (isError) return <FeatureStoreError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/feature-store">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <FeatureStoreEmpty label="No feature matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to feature store">
          <Link href="/feature-store">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.key}</span>
        <StatusBadge label={data.status.label} tone={data.status.tone} />
        <StatusBadge label={`v${data.version}`} tone="neutral" />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge label={`Approval: ${data.approval.label}`} tone={data.approval.tone} />
        <StatusBadge label={`Validation: ${data.validation.label}`} tone={data.validation.tone} />
        <StatusBadge
          label={`Quality: ${data.quality.grade.label}`}
          tone={data.quality.grade.tone}
        />
        <StatusBadge label={`Health: ${data.health.status.label}`} tone={data.health.status.tone} />
        <StatusBadge label={`Sync: ${data.sync.status.label}`} tone={data.sync.status.tone} />
      </div>
      <GovernanceNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DefinitionPanel definition={data.definition} rationale={data.definition.rationale} />
        <SchemaPanel fields={data.schema} />
        <VersionsPanel versions={data.versions} />
        <DependenciesPanel dependencies={data.dependencies} />
        <LineagePanel lineage={data.lineage} />
        <OwnershipPanel owner={data.owner} />
        <UsagePanel usage={data.usage} />
        <QualityPanel quality={data.quality} />
        <HealthPanel health={data.health} validation={data.validation} />
        <RegistrySyncPanel sync={data.sync} />
        <TagsPanel tags={data.tags} />
        <MetadataPanel rows={data.metadata} />
      </div>
    </div>
  );
}
