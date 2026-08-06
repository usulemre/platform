import Link from 'next/link';
import { cn } from '@platform/utils';
import { InfoCard, KeyValueList, StatusBadge } from './performance-atoms';
import type {
  ApprovalVm,
  ArtifactVm,
  BenchmarkVm,
  DependencyVm,
  MetricGroupVm,
  ReviewVm,
  SeriesVm,
  SnapshotVm,
  StageStepVm,
  TimelineEventVm,
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

/** Report lifecycle timeline (draft → archived). */
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

/** Metrics grouped by category — supplied values (nothing computed here). */
export function MetricsPanel({ groups }: { groups: readonly MetricGroupVm[] }) {
  return (
    <InfoCard title="Metrics">
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No metrics computed yet.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.category}>
              <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                {group.label}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {group.metrics.map((metric) => (
                  <div key={metric.key} className="rounded-md border p-2">
                    <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
                    <p className="text-lg font-semibold">{metric.value}</p>
                    <p className="text-[10px] text-muted-foreground">
                      def v{metric.definitionVersion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Metric values are computed by the analytics runtime under the versioned catalog definitions
        — never computed by this console.
      </p>
    </InfoCard>
  );
}

/** Performance series — inert supplied points rendered as a simple bar (presentation-only scaling). */
export function SeriesPanel({ series }: { series: readonly SeriesVm[] }) {
  return (
    <InfoCard title="Series">
      {series.length === 0 ? (
        <p className="text-sm text-muted-foreground">No series.</p>
      ) : (
        <div className="space-y-4">
          {series.map((entry) => (
            <div key={entry.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{entry.label}</span>
                <span className="text-xs text-muted-foreground">{entry.unit}</span>
              </div>
              <ul className="space-y-1">
                {entry.points.map((point) => (
                  <li key={point.t} className="flex items-center gap-2 text-xs">
                    <span className="w-20 shrink-0 text-muted-foreground">{point.t}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        aria-hidden
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${point.percent}%` }}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-right font-mono">{point.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Series points are supplied by the analytics runtime; bar widths are presentation-only
        scaling, never a calculation.
      </p>
    </InfoCard>
  );
}

/** Benchmark comparison — subject vs benchmark values (both supplied). */
export function BenchmarkPanel({ benchmark }: { benchmark: BenchmarkVm }) {
  return (
    <InfoCard
      title="Benchmark comparison"
      action={<StatusBadge label={benchmark.kind} tone="info" />}
    >
      <div className="space-y-2 text-sm">
        <p className="font-medium">{benchmark.name}</p>
        <p className="text-xs text-muted-foreground">{benchmark.note}</p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Metric</th>
                <th className="px-3 py-1.5 text-right font-medium">Subject</th>
                <th className="px-3 py-1.5 text-right font-medium">Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {benchmark.rows.map((row) => (
                <tr key={row.key} className="border-t">
                  <td className="px-3 py-1.5 font-medium">{row.label}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{row.subjectValue}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                    {row.benchmarkValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p role="note" className="text-xs text-muted-foreground">
          Both subject and benchmark values are supplied — never computed, ranked or scored by this
          console.
        </p>
      </div>
    </InfoCard>
  );
}

/** Report validation. */
export function ValidationPanel({ validation }: { validation: ValidationVm }) {
  return (
    <InfoCard
      title="Validation"
      action={<StatusBadge label={validation.status.label} tone={validation.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{validation.note}</p>
        <KeyValueList
          rows={[
            { label: 'Method', value: validation.method },
            { label: 'Checked', value: validation.checkedLabel ?? '—' },
          ]}
        />
      </div>
    </InfoCard>
  );
}

/** Report reviews. */
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

/** Report approvals (decided by governance). */
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

/** Report artifacts. */
export function ArtifactsPanel({ artifacts }: { artifacts: readonly ArtifactVm[] }) {
  return (
    <InfoCard title="Artifacts">
      {artifacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No artifacts.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {artifacts.map((artifact) => (
            <li key={artifact.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span className="font-medium">{artifact.name}</span>
              <StatusBadge label={artifact.kind} tone="info" />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Performance timeline. */
export function TimelinePanel({ timeline }: { timeline: readonly TimelineEventVm[] }) {
  return (
    <InfoCard title="Performance timeline">
      {timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground">No timeline events.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {timeline.map((event) => (
            <li key={event.id} className="flex items-start gap-3 border-b py-1">
              <span
                aria-hidden
                className={cn(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full border',
                  DOT[event.tone] ?? DOT.neutral,
                )}
              />
              <div className="flex flex-1 items-start justify-between gap-2">
                <span>
                  <span className="font-medium">{event.label}</span>{' '}
                  <StatusBadge label={event.kind} tone="neutral" />
                  <p className="text-xs text-muted-foreground">{event.detail}</p>
                </span>
                <span className="text-xs text-muted-foreground">{event.atLabel}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}

/** Report dependencies — cross-linked subjects. */
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
                {dependency.href ? (
                  <Link href={dependency.href} className="font-medium hover:underline">
                    {dependency.name}
                  </Link>
                ) : (
                  <span className="font-medium">{dependency.name}</span>
                )}
              </span>
              <StatusBadge label={dependency.status.label} tone={dependency.status.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Report versions. */
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

/** Performance snapshots. */
export function SnapshotsPanel({ snapshots }: { snapshots: readonly SnapshotVm[] }) {
  return (
    <InfoCard title="Snapshots">
      {snapshots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No snapshots.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {snapshots.map((snapshot) => (
            <li
              key={`${snapshot.version}-${snapshot.manifestHash}`}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono font-medium">{snapshot.version}</span>
                <StatusBadge label={snapshot.stage.label} tone={snapshot.stage.tone} />
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{snapshot.capturedLabel}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {snapshot.manifestHash}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}
