import Link from 'next/link';
import { cn } from '@platform/utils';
import { InfoCard, KeyValueList, StatusBadge, TagList } from './signal-engine-atoms';
import type {
  ApprovalVm,
  DependencyVm,
  HealthVm,
  LineageVm,
  MetadataRowVm,
  OwnerVm,
  PromotionVm,
  QualityVm,
  ReviewVm,
  SignalDetailVm,
  StageStepVm,
  SyncVm,
  UsageVm,
  ValidationVm,
  VersionVm,
} from '../domain/view-model';

const DOT: Record<string, string> = {
  positive: 'bg-primary border-primary',
  info: 'bg-background border-primary ring-2 ring-primary/30',
  danger: 'bg-destructive border-destructive',
  neutral: 'bg-background border-muted-foreground/40',
  warning: 'bg-background border-muted-foreground/40',
};

/** Signal lifecycle timeline (candidate → production candidate). */
export function LifecycleTimeline({ stages }: { stages: readonly StageStepVm[] }) {
  return (
    <InfoCard title="Lifecycle">
      <ol className="space-y-3">
        {stages.map((step) => (
          <li key={step.stage} className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn(
                'mt-1 h-3 w-3 shrink-0 rounded-full border',
                DOT[step.state.tone] ?? DOT.neutral,
              )}
            />
            <div className="flex flex-1 items-center justify-between gap-2 text-sm">
              <span
                className={cn(
                  'font-medium',
                  step.state.value === 'PENDING' && 'text-muted-foreground',
                )}
              >
                {step.label}
                {step.gate ? (
                  <span className="ml-1 text-xs uppercase text-muted-foreground">gate</span>
                ) : null}
              </span>
              <StatusBadge label={step.state.label} tone={step.state.tone} />
            </div>
          </li>
        ))}
      </ol>
    </InfoCard>
  );
}

/** Signal Definition — declarative "what it is", never how it is computed. */
export function DefinitionPanel({ definition }: { definition: SignalDetailVm['definition'] }) {
  const rows: MetadataRowVm[] = [
    { label: 'Entity', value: definition.entity },
    { label: 'Horizon', value: definition.horizon },
    { label: 'Direction', value: definition.direction },
  ];
  return (
    <InfoCard title="Definition">
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">{definition.rationale}</p>
        <KeyValueList rows={rows} />
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Input features
          </h3>
          {definition.features.length === 0 ? (
            <p className="text-muted-foreground">None.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {definition.features.map((feature) => (
                <Link
                  key={feature.ref}
                  href={feature.href}
                  className="rounded-md border px-2 py-0.5 font-mono text-xs hover:bg-accent"
                >
                  {feature.ref}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </InfoCard>
  );
}

/** Signal Validation Status — the recorded validation (verdict decided elsewhere). */
export function ValidationPanel({ validation }: { validation: ValidationVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Method', value: validation.method },
    { label: 'Checked', value: validation.checkedLabel ?? '—' },
  ];
  return (
    <InfoCard
      title="Validation status"
      action={<StatusBadge label={validation.status.label} tone={validation.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{validation.note}</p>
        <KeyValueList rows={rows} />
        <p role="note" className="text-xs text-muted-foreground">
          The validation verdict is produced by the Validation Foundation, never by this console.
        </p>
      </div>
    </InfoCard>
  );
}

/** Signal Versions — immutable, versioned definitions (newest first). */
export function VersionsPanel({ versions }: { versions: readonly VersionVm[] }) {
  return (
    <InfoCard title="Versions">
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No versions.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {versions.map((version) => (
            <li key={version.version} className="border-b py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="font-mono font-medium">{version.version}</span>
                  {version.current ? (
                    <span className="text-xs uppercase text-primary">current</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{version.createdLabel}</span>
                  <StatusBadge label={version.stage.label} tone={version.stage.tone} />
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{version.note}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{version.manifestHash}</p>
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}

/** Signal Dependencies — upstream features/datasets/signals (cross-linked). */
export function DependenciesPanel({ dependencies }: { dependencies: readonly DependencyVm[] }) {
  return (
    <InfoCard title="Dependencies">
      {dependencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No dependencies.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {dependencies.map((dependency) => (
            <li
              key={dependency.id}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span className="flex items-center gap-2">
                <StatusBadge label={dependency.kind} tone="info" />
                <Link href={dependency.href} className="font-medium hover:underline">
                  {dependency.name}
                </Link>
              </span>
              <StatusBadge label={dependency.status.label} tone={dependency.status.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Signal Lineage — provenance from features to signal. */
export function LineagePanel({ lineage }: { lineage: LineageVm }) {
  return (
    <InfoCard title="Lineage">
      {lineage.nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No lineage recorded.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {lineage.nodes.map((node, index) => (
            <li key={node.id} className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{index + 1}</span>
              <StatusBadge label={node.kind.replace('_', ' ')} tone="neutral" />
              {node.href ? (
                <Link href={node.href} className="font-medium hover:underline">
                  {node.label}
                </Link>
              ) : (
                <span className="font-medium">{node.label}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}

/** Signal Approval — governance approvals (decided by humans). */
export function ApprovalsPanel({ approvals }: { approvals: readonly ApprovalVm[] }) {
  return (
    <InfoCard title="Approval">
      {approvals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No approvals requested.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {approvals.map((approval) => (
            <li key={approval.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                {approval.role}
                {approval.rationale ? (
                  <p className="text-xs text-muted-foreground">{approval.rationale}</p>
                ) : null}
              </span>
              <span className="flex items-center gap-2">
                {approval.decidedLabel ? (
                  <span className="text-xs text-muted-foreground">{approval.decidedLabel}</span>
                ) : null}
                <StatusBadge label={approval.status.label} tone={approval.status.tone} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Approval is a governance decision — recorded here, never made by this console.
      </p>
    </InfoCard>
  );
}

/** Signal Review — independent methodology reviews. */
export function ReviewsPanel({ reviews }: { reviews: readonly ReviewVm[] }) {
  return (
    <InfoCard title="Reviews">
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {reviews.map((review) => (
            <li key={review.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{review.stageLabel}</span>{' '}
                <span className="text-xs text-muted-foreground">· {review.reviewer}</span>
                {review.note ? (
                  <p className="text-xs text-muted-foreground">{review.note}</p>
                ) : null}
              </span>
              <span className="flex items-center gap-2">
                {review.reviewedLabel ? (
                  <span className="text-xs text-muted-foreground">{review.reviewedLabel}</span>
                ) : null}
                <StatusBadge label={review.status.label} tone={review.status.tone} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Signal Promotion — promotion state toward a production candidate. */
export function PromotionPanel({ promotion }: { promotion: PromotionVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Target', value: promotion.target },
    { label: 'Queued', value: promotion.queuedLabel ?? '—' },
    { label: 'Promoted', value: promotion.promotedLabel ?? '—' },
  ];
  return (
    <InfoCard
      title="Promotion"
      action={<StatusBadge label={promotion.status.label} tone={promotion.status.tone} />}
    >
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Signal Ownership — owner, team and steward. */
export function OwnershipPanel({ owner }: { owner: OwnerVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Owner', value: owner.owner },
    { label: 'Team', value: owner.team },
    { label: 'Steward', value: owner.steward },
  ];
  return (
    <InfoCard title="Ownership">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Signal Usage — downstream strategies, backtests, portfolios. */
export function UsagePanel({ usage }: { usage: UsageVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Strategies', value: usage.strategies },
    { label: 'Backtests', value: usage.backtests },
    { label: 'Portfolios', value: usage.portfolios },
    { label: 'Last accessed', value: usage.lastAccessedLabel ?? '—' },
  ];
  return (
    <InfoCard title="Usage">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Signal Quality — coverage/stability indicators (verdict decided elsewhere). */
export function QualityPanel({ quality }: { quality: QualityVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Coverage', value: quality.coverage },
    { label: 'Stability', value: quality.stability },
    { label: 'Checked', value: quality.checkedLabel ?? '—' },
  ];
  return (
    <InfoCard
      title="Quality"
      action={<StatusBadge label={quality.grade.label} tone={quality.grade.tone} />}
    >
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Signal Health — operational health indicator. */
export function HealthPanel({ health }: { health: HealthVm }) {
  return (
    <InfoCard
      title="Health"
      action={<StatusBadge label={health.status.label} tone={health.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{health.message}</p>
        <div className="flex items-center justify-between gap-4 py-1">
          <span className="text-muted-foreground">Last refreshed</span>
          <span className="font-medium">{health.refreshedLabel ?? '—'}</span>
        </div>
      </div>
    </InfoCard>
  );
}

/** Signal Registry Synchronization — sync state with the Signal Registry. */
export function RegistrySyncPanel({ sync }: { sync: SyncVm }) {
  return (
    <InfoCard
      title="Registry synchronization"
      action={<StatusBadge label={sync.status.label} tone={sync.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4 border-b py-1">
          <span className="text-muted-foreground">Registry ref</span>
          <span className="font-mono font-medium">{sync.registryRef}</span>
        </div>
        <div className="flex items-center justify-between gap-4 py-1">
          <span className="text-muted-foreground">Last synced</span>
          <span className="font-medium">{sync.syncedLabel ?? '—'}</span>
        </div>
        <p role="note" className="text-xs text-muted-foreground">
          The Signal Registry is the source of truth; the engine only reflects and requests sync.
        </p>
      </div>
    </InfoCard>
  );
}

/** Signal Tags. */
export function TagsPanel({ tags }: { tags: readonly string[] }) {
  return (
    <InfoCard title="Tags">
      <TagList tags={tags} />
    </InfoCard>
  );
}

/** Signal Metadata. */
export function MetadataPanel({ rows }: { rows: readonly MetadataRowVm[] }) {
  return (
    <InfoCard title="Metadata">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}
