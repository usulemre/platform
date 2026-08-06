'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useAssessment } from '../hooks/use-risk-engine';
import {
  RiskEmpty,
  RiskError,
  RiskLoading,
  GovernanceNotice,
  InfoCard,
  KeyValueList,
  ProgressBar,
  StatusBadge,
  TagList,
} from './risk-engine-atoms';
import {
  ApprovalsPanel,
  AuditTimelinePanel,
  ConstraintsPanel,
  ControlsPanel,
  DependenciesPanel,
  ExceptionsPanel,
  ExposuresPanel,
  LifecycleTimeline,
  LimitsPanel,
  LineagePanel,
  MetricsOverview,
  OverridesPanel,
  PoliciesPanel,
  ReportsPanel,
  ReviewsPanel,
  RulesPanel,
  SnapshotsPanel,
  ValidationPanel,
  VersionsPanel,
} from './panels';

/** Portfolio Risk Details — the full record for one assessment: lifecycle, controls,
 *  subject, policies, rules, limits, exposures, indicators, validation, exceptions,
 *  overrides, reviews, approval, reports, audit timeline, dependencies, lineage,
 *  versions, snapshots, links and metadata. */
export function RiskDetailView({ assessmentId }: { assessmentId: string }) {
  const { data, isLoading, isError, refetch } = useAssessment(assessmentId);

  if (isLoading) return <RiskLoading />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/risk-engine">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <RiskEmpty label="No assessment matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to risk engine">
          <Link href="/risk-engine">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.key}</span>
        <StatusBadge label={data.decision.label} tone={data.decision.tone} />
        <StatusBadge label={data.stage.label} tone={data.stage.tone} />
        <StatusBadge label={`v${data.version}`} tone="neutral" />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">Subject:</span>
        {data.subject.href ? (
          <Link href={data.subject.href} className="rounded-md border px-3 py-1 hover:bg-accent">
            {data.subject.kind} · {data.subject.name}
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-1">
            {data.subject.kind} · {data.subject.name}
          </span>
        )}
      </div>
      <div className="max-w-md">
        <ProgressBar progress={data.progress} ariaLabel="Lifecycle progress" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Validation: ${data.validation.status.label}`}
          tone={data.validation.status.tone}
        />
        <StatusBadge label={`Approval: ${data.approval.label}`} tone={data.approval.tone} />
      </div>
      {data.links.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-sm">
          {data.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
      <GovernanceNotice />

      <MetricsOverview metrics={data.metrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LifecycleTimeline stages={data.stages} />
        <ControlsPanel controls={data.controls} />
        <PoliciesPanel policies={data.policies} />
        <RulesPanel rules={data.rules} />
      </div>

      <LimitsPanel limits={data.limits} />
      <ExposuresPanel exposures={data.exposures} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConstraintsPanel constraints={data.constraints} />
        <ValidationPanel validation={data.validation} />
        <ExceptionsPanel exceptions={data.exceptions} />
        <OverridesPanel overrides={data.overrides} />
        <ReviewsPanel reviews={data.reviews} />
        <ApprovalsPanel approvals={data.approvals} />
        <ReportsPanel reports={data.reports} />
        <DependenciesPanel dependencies={data.dependencies} />
        <LineagePanel lineage={data.lineage} />
        <VersionsPanel versions={data.versions} />
        <SnapshotsPanel snapshots={data.snapshots} />
      </div>

      <AuditTimelinePanel audit={data.audit} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Ownership">
          <KeyValueList
            rows={[
              { label: 'Owner', value: data.owner.owner },
              { label: 'Team', value: data.owner.team },
              { label: 'Steward', value: data.owner.steward },
            ]}
          />
        </InfoCard>
        <InfoCard title="Tags">
          <TagList tags={data.tags} />
        </InfoCard>
        <InfoCard title="Metadata">
          <KeyValueList rows={data.metadata} />
        </InfoCard>
      </div>
    </div>
  );
}
