'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useSignal } from '../hooks/use-signal-engine';
import {
  GovernanceNotice,
  ProgressBar,
  SignalEngineEmpty,
  SignalEngineError,
  SignalEngineLoading,
  StatusBadge,
} from './signal-engine-atoms';
import {
  ApprovalsPanel,
  DefinitionPanel,
  DependenciesPanel,
  HealthPanel,
  LifecycleTimeline,
  LineagePanel,
  MetadataPanel,
  OwnershipPanel,
  PromotionPanel,
  QualityPanel,
  RegistrySyncPanel,
  ReviewsPanel,
  TagsPanel,
  UsagePanel,
  ValidationPanel,
  VersionsPanel,
} from './panels';

/** Signal Details — the full record for one registered signal: lifecycle,
 *  definition, validation status, versions, dependencies, lineage, approval,
 *  review, promotion, ownership, usage, quality, health, registry sync, tags and
 *  metadata. */
export function SignalDetailView({ signalId }: { signalId: string }) {
  const { data, isLoading, isError, refetch } = useSignal(signalId);

  if (isLoading) return <SignalEngineLoading />;
  if (isError) return <SignalEngineError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/signal-engine">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <SignalEngineEmpty label="No signal matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to signal engine">
          <Link href="/signal-engine">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.key}</span>
        <StatusBadge label={data.stage.label} tone={data.stage.tone} />
        <StatusBadge label={`v${data.version}`} tone="neutral" />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <div className="max-w-md">
        <ProgressBar progress={data.progress} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Validation: ${data.validation.status.label}`}
          tone={data.validation.status.tone}
        />
        <StatusBadge label={`Approval: ${data.approval.label}`} tone={data.approval.tone} />
        <StatusBadge
          label={`Promotion: ${data.promotion.status.label}`}
          tone={data.promotion.status.tone}
        />
        <StatusBadge
          label={`Quality: ${data.quality.grade.label}`}
          tone={data.quality.grade.tone}
        />
        <StatusBadge label={`Health: ${data.health.status.label}`} tone={data.health.status.tone} />
      </div>
      <GovernanceNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DefinitionPanel definition={data.definition} />
        <LifecycleTimeline stages={data.stages} />
        <ValidationPanel validation={data.validation} />
        <VersionsPanel versions={data.versions} />
        <DependenciesPanel dependencies={data.dependencies} />
        <LineagePanel lineage={data.lineage} />
        <ReviewsPanel reviews={data.reviews} />
        <ApprovalsPanel approvals={data.approvals} />
        <PromotionPanel promotion={data.promotion} />
        <OwnershipPanel owner={data.owner} />
        <UsagePanel usage={data.usage} />
        <QualityPanel quality={data.quality} />
        <HealthPanel health={data.health} />
        <RegistrySyncPanel sync={data.sync} />
        <TagsPanel tags={data.tags} />
        <MetadataPanel rows={data.metadata} />
      </div>
    </div>
  );
}
