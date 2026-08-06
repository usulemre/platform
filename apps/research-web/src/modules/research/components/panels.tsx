import Link from 'next/link';
import { cn } from '@platform/utils';
import { InfoCard, KeyValueList, StatusBadge } from './research-atoms';
import type {
  ApprovalVm,
  ArtifactVm,
  DependencyVm,
  HypothesisVm,
  MetadataRowVm,
  MetricsVm,
  MilestoneVm,
  ObjectiveVm,
  ReviewVm,
  SessionVm,
  StageStepVm,
} from '../domain/view-model';

const DOT: Record<string, string> = {
  positive: 'bg-primary border-primary',
  info: 'bg-background border-primary ring-2 ring-primary/30',
  danger: 'bg-destructive border-destructive',
  neutral: 'bg-background border-muted-foreground/40',
  warning: 'bg-background border-muted-foreground/40',
};

/** Research Lifecycle timeline (Research Lifecycle / Research Timeline). */
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
              <span className="flex items-center gap-2">
                {step.dateLabel ? (
                  <span className="text-xs text-muted-foreground">{step.dateLabel}</span>
                ) : null}
                <StatusBadge label={step.state.label} tone={step.state.tone} />
              </span>
            </div>
          </li>
        ))}
      </ol>
    </InfoCard>
  );
}

/** Research Hypothesis (pre-registration). */
export function HypothesisPanel({ hypothesis }: { hypothesis: HypothesisVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Prediction', value: hypothesis.prediction },
    { label: 'Success criteria', value: hypothesis.successCriteria },
    { label: 'Registered', value: hypothesis.registeredLabel ?? '—' },
  ];
  return (
    <InfoCard title="Hypothesis">
      <div className="space-y-3 text-sm">
        <p>{hypothesis.statement}</p>
        <StatusBadge label={hypothesis.preRegistered.label} tone={hypothesis.preRegistered.tone} />
        <KeyValueList rows={rows} />
      </div>
    </InfoCard>
  );
}

/** Research Objectives. */
export function ObjectivesPanel({ objectives }: { objectives: readonly ObjectiveVm[] }) {
  return (
    <InfoCard title="Objectives">
      {objectives.length === 0 ? (
        <p className="text-sm text-muted-foreground">No objectives.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {objectives.map((objective) => (
            <li
              key={objective.id}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span>{objective.label}</span>
              <StatusBadge label={objective.status.label} tone={objective.status.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Research Dependencies. */
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
              <span>{dependency.label}</span>
              <StatusBadge label={dependency.status.label} tone={dependency.status.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Research Milestones (part of the timeline). */
export function MilestonesPanel({ milestones }: { milestones: readonly MilestoneVm[] }) {
  return (
    <InfoCard title="Milestones">
      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">No milestones.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {milestones.map((milestone) => (
            <li
              key={milestone.id}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span>
                {milestone.label}{' '}
                <span className="text-xs text-muted-foreground">· {milestone.stageLabel}</span>
              </span>
              <span className="flex items-center gap-2">
                {milestone.dueLabel ? (
                  <span className="text-xs text-muted-foreground">{milestone.dueLabel}</span>
                ) : null}
                <StatusBadge label={milestone.status.label} tone={milestone.status.tone} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Research Validation — stage reviews and sign-off (Validation Foundation). */
export function ReviewsPanel({ reviews }: { reviews: readonly ReviewVm[] }) {
  return (
    <InfoCard title="Validation & reviews">
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
              <StatusBadge label={review.status.label} tone={review.status.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Research Approval — governance approvals (decided by humans/governance). */
export function ApprovalsPanel({ approvals }: { approvals: readonly ApprovalVm[] }) {
  return (
    <InfoCard title="Approval">
      {approvals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No approvals.</p>
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

/** Research Sessions. */
export function SessionsPanel({ sessions }: { sessions: readonly SessionVm[] }) {
  return (
    <InfoCard title="Sessions">
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {sessions.map((session) => (
            <li key={session.id} className="border-b py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{session.author}</span>
                <span className="text-xs text-muted-foreground">
                  {session.startedLabel} {session.open ? '· open' : ''}
                </span>
              </div>
              <p className="text-muted-foreground">{session.summary}</p>
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}

/** Research Artifacts — cross-links into the other research-web modules. */
export function ArtifactsPanel({ artifacts }: { artifacts: readonly ArtifactVm[] }) {
  return (
    <InfoCard title="Artifacts">
      {artifacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No artifacts.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {artifacts.map((artifact) => (
            <li key={artifact.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span className="flex items-center gap-2">
                <StatusBadge label={artifact.kind} tone="info" />
                {artifact.href === '#' ? (
                  <span className="font-medium">{artifact.name}</span>
                ) : (
                  <Link href={artifact.href} className="font-medium hover:underline">
                    {artifact.name}
                  </Link>
                )}
              </span>
              <span className="text-xs text-muted-foreground">{artifact.stageLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Research Metadata. */
export function MetadataPanel({ rows }: { rows: readonly MetadataRowVm[] }) {
  return (
    <InfoCard title="Metadata">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Research Metrics (pre-supplied productivity metrics; nothing computed). */
export function MetricsPanel({ metrics }: { metrics: MetricsVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Open objectives', value: metrics.openObjectives },
    { label: 'Artifacts', value: metrics.artifacts },
    { label: 'Sessions', value: metrics.sessions },
    { label: 'Reviews pending', value: metrics.reviewsPending },
  ];
  return (
    <InfoCard title="Metrics">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}
