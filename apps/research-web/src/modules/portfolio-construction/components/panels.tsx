import Link from 'next/link';
import { cn } from '@platform/utils';
import { InfoCard, KeyValueList, ProgressBar, StatusBadge } from './portfolio-construction-atoms';
import type {
  AllocationVm,
  ApprovalVm,
  ArtifactVm,
  ConstraintVm,
  DependencyVm,
  LineageVm,
  MetricVm,
  OptimizationControlVm,
  OptimizationRequestVm,
  OptimizationVm,
  ReviewVm,
  SessionVm,
  SignalSelectionVm,
  SnapshotVm,
  StageStepVm,
  UniverseVm,
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

/** Portfolio lifecycle timeline (draft → archived). */
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

/** Optimization request status + progress + available controls (advisory availability only). */
export function OptimizationPanel({
  optimization,
  controls,
}: {
  optimization: OptimizationVm;
  controls: readonly OptimizationControlVm[];
}) {
  return (
    <InfoCard
      title="Optimization request"
      action={<StatusBadge label={optimization.status.label} tone={optimization.status.tone} />}
    >
      <div className="space-y-3 text-sm">
        <ProgressBar
          progress={{
            percent: optimization.progressPercent,
            label: `${optimization.progressPercent}%`,
            currentStageLabel: `Objective: ${optimization.objective}`,
          }}
          ariaLabel="Optimization progress"
        />
        <p className="text-muted-foreground">{optimization.note}</p>
        <KeyValueList
          rows={[
            { label: 'Objective', value: optimization.objective },
            { label: 'Attempt', value: String(optimization.attempt) },
            { label: 'Requested', value: optimization.requestedLabel ?? '—' },
            { label: 'Completed', value: optimization.completedLabel ?? '—' },
          ]}
        />
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Available controls
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {controls.map((control) => (
              <span
                key={control.control}
                className={cn(
                  'rounded-md border px-2 py-0.5 text-xs',
                  control.enabled
                    ? 'border-primary text-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground line-through',
                )}
              >
                {control.label}
              </span>
            ))}
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Cancel / retry are governed controls, executed by the optimizer — availability shown
            here.
          </p>
        </div>
      </div>
    </InfoCard>
  );
}

/** Portfolio Universe. */
export function UniversePanel({ universe }: { universe: UniverseVm }) {
  return (
    <InfoCard title="Universe">
      <div className="space-y-2 text-sm">
        <p className="font-medium">{universe.name}</p>
        <p className="text-muted-foreground">{universe.description}</p>
        <KeyValueList
          rows={[
            { label: 'Instruments', value: String(universe.instrumentCount) },
            { label: 'Asset classes', value: universe.assetClasses.join(', ') || '—' },
          ]}
        />
      </div>
    </InfoCard>
  );
}

/** Portfolio Signal Selection — selected input signals (referenced only). */
export function SignalSelectionPanel({ selection }: { selection: readonly SignalSelectionVm[] }) {
  return (
    <InfoCard title="Signal selection">
      {selection.length === 0 ? (
        <p className="text-sm text-muted-foreground">No signals selected.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {selection.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span className="flex items-center gap-2">
                <Link href={item.href} className="font-medium hover:underline">
                  {item.name}
                </Link>
                <span className="text-xs text-muted-foreground">weight hint {item.weightHint}</span>
              </span>
              <StatusBadge label={item.status.label} tone={item.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Only capital-eligible signals are selected here; this console never re-adjudicates whether a
        signal is real.
      </p>
    </InfoCard>
  );
}

/** Portfolio Constraints — declared bounds (evaluated elsewhere). */
export function ConstraintsPanel({ constraints }: { constraints: readonly ConstraintVm[] }) {
  return (
    <InfoCard title="Constraints">
      {constraints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No constraints declared.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {constraints.map((constraint) => (
            <li
              key={constraint.id}
              className="flex items-start justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="flex items-center gap-2">
                  <StatusBadge label={constraint.kind} tone="info" />
                  <span className="font-medium">{constraint.label}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">{constraint.bound}</span>
                {constraint.note ? (
                  <p className="text-xs text-muted-foreground">{constraint.note}</p>
                ) : null}
              </span>
              <StatusBadge label={constraint.status.label} tone={constraint.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Constraint bounds are declared here; constraint satisfaction is evaluated by deterministic
        engines, not this console.
      </p>
    </InfoCard>
  );
}

/** Portfolio Allocation Explorer — configuration + target holdings (weights supplied). */
export function AllocationPanel({ allocation }: { allocation: AllocationVm }) {
  return (
    <InfoCard title="Allocation">
      <div className="space-y-3 text-sm">
        <KeyValueList rows={allocation.rows} />
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Target holdings
          </h3>
          {allocation.holdings.length === 0 ? (
            <p className="text-muted-foreground">No holdings yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium">Instrument</th>
                    <th className="px-3 py-1.5 text-left font-medium">Asset class</th>
                    <th className="px-3 py-1.5 text-left font-medium">Side</th>
                    <th className="px-3 py-1.5 text-right font-medium">Target weight</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation.holdings.map((holding) => (
                    <tr key={holding.id} className="border-t">
                      <td className="px-3 py-1.5">
                        <span className="font-medium">{holding.name}</span>{' '}
                        <span className="font-mono text-xs text-muted-foreground">
                          {holding.ref}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{holding.assetClass}</td>
                      <td className="px-3 py-1.5">
                        <StatusBadge label={holding.side.label} tone={holding.side.tone} />
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">{holding.targetWeight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {allocation.notes ? (
          <p className="text-xs text-muted-foreground">{allocation.notes}</p>
        ) : null}
        <p role="note" className="text-xs text-muted-foreground">
          Target weights are produced by the optimizer and reported here — never computed by this
          console.
        </p>
      </div>
    </InfoCard>
  );
}

/** Portfolio characteristics overview — supplied metric values (nothing computed here). */
export function MetricsOverview({ metrics }: { metrics: readonly MetricVm[] }) {
  return (
    <InfoCard title="Characteristics overview">
      {metrics.length === 0 ? (
        <p className="text-sm text-muted-foreground">No characteristics yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.key} className="rounded-md border p-2">
              <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Characteristics are produced by the optimizer / risk engine and reported here — never
        computed by this console.
      </p>
    </InfoCard>
  );
}

/** Portfolio Validation. */
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
        <p role="note" className="text-xs text-muted-foreground">
          The validation verdict is produced by the Validation Foundation, never by this console.
        </p>
      </div>
    </InfoCard>
  );
}

/** Portfolio Optimization Requests history. */
export function OptimizationRequestsPanel({
  requests,
}: {
  requests: readonly OptimizationRequestVm[];
}) {
  return (
    <InfoCard title="Optimization requests">
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No optimization requests.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {requests.map((request) => (
            <li key={request.id} className="border-b py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {request.objective}{' '}
                  <span className="text-xs text-muted-foreground">· attempt {request.attempt}</span>
                </span>
                <StatusBadge label={request.status.label} tone={request.status.tone} />
              </div>
              <p className="text-xs text-muted-foreground">{request.note}</p>
              <p className="text-[11px] text-muted-foreground">
                {request.requestedLabel ?? '—'}
                {request.completedLabel ? ` → ${request.completedLabel}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Optimization runs in the external optimizer — surfaced here, never run by this console.
      </p>
    </InfoCard>
  );
}

/** Portfolio Sessions. */
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
                  {session.startedLabel}
                  {session.open ? ' · open' : ''}
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

/** Portfolio Dependencies — cross-linked inputs. */
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

/** Portfolio Lineage — provenance across the research chain. */
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

/** Portfolio Artifacts. */
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

/** Portfolio reviews. */
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

/** Portfolio approvals (decided by governance). */
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

/** Portfolio Versions. */
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

/** Portfolio Snapshots — immutable point-in-time snapshot references. */
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
