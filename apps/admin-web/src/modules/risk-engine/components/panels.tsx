import Link from 'next/link';
import { cn } from '@platform/utils';
import { InfoCard, KeyValueList, StatusBadge } from './risk-engine-atoms';
import type {
  ApprovalVm,
  AuditVm,
  ConstraintVm,
  ControlVm,
  DependencyVm,
  ExceptionVm,
  ExposureVm,
  LimitVm,
  LineageVm,
  MetricVm,
  OverrideVm,
  PolicyVm,
  ReportVm,
  ReviewVm,
  RuleVm,
  SnapshotVm,
  StageStepVm,
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

/** Risk lifecycle timeline (draft → archived). */
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

/** Governance controls (advisory availability only). */
export function ControlsPanel({ controls }: { controls: readonly ControlVm[] }) {
  return (
    <InfoCard title="Governance controls">
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
        Revalidate / raise-exception / record-override are governed controls executed by the
        workflow engine and accountable humans — availability shown here, never actioned by this
        console.
      </p>
    </InfoCard>
  );
}

/** Risk Policies applied to the assessment. */
export function PoliciesPanel({ policies }: { policies: readonly PolicyVm[] }) {
  return (
    <InfoCard title="Policies">
      {policies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No policies applied.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {policies.map((policy) => (
            <li key={policy.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="flex items-center gap-2">
                  <StatusBadge label={policy.category} tone="info" />
                  <span className="font-medium">{policy.name}</span>
                  <span className="text-xs text-muted-foreground">v{policy.version}</span>
                </span>
                <p className="text-xs text-muted-foreground">{policy.description}</p>
              </span>
              <StatusBadge label={policy.status.label} tone={policy.status.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Risk Rule Explorer — the evaluated rules (verdicts decided elsewhere). */
export function RulesPanel({ rules }: { rules: readonly RuleVm[] }) {
  return (
    <InfoCard title="Rule explorer">
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rules.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="font-mono text-xs text-muted-foreground">{rule.code}</span>{' '}
                <span className="font-medium">{rule.label}</span>
                <p className="font-mono text-xs text-muted-foreground">
                  {rule.expression} · severity {rule.severity}
                </p>
              </span>
              <StatusBadge label={rule.status.label} tone={rule.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Rule evaluation is performed by deterministic engines; statuses are reflected here, never
        decided.
      </p>
    </InfoCard>
  );
}

/** Limit Configuration — configured limits + reported utilization (values supplied). */
export function LimitsPanel({ limits }: { limits: readonly LimitVm[] }) {
  return (
    <InfoCard title="Limits">
      {limits.length === 0 ? (
        <p className="text-sm text-muted-foreground">No limits configured.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Limit</th>
                <th className="px-3 py-1.5 text-left font-medium">Scope</th>
                <th className="px-3 py-1.5 text-right font-medium">Bound</th>
                <th className="px-3 py-1.5 text-right font-medium">Utilization</th>
                <th className="px-3 py-1.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {limits.map((limit) => (
                <tr key={limit.id} className="border-t">
                  <td className="px-3 py-1.5 font-medium">{limit.label}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{limit.scope}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{limit.bound}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{limit.utilization}</td>
                  <td className="px-3 py-1.5 text-right">
                    <StatusBadge label={limit.status.label} tone={limit.status.tone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Utilization values are reported by the risk model — never computed by this console.
      </p>
    </InfoCard>
  );
}

/** Exposure Summary — reported exposures by dimension (values supplied). */
export function ExposuresPanel({ exposures }: { exposures: readonly ExposureVm[] }) {
  return (
    <InfoCard title="Exposure summary">
      {exposures.length === 0 ? (
        <p className="text-sm text-muted-foreground">No exposures reported.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {exposures.map((exposure) => (
            <li key={exposure.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span className="flex items-center gap-2">
                <StatusBadge label={exposure.dimension} tone="neutral" />
                <span className="font-medium">{exposure.label}</span>
                <span className="text-xs text-muted-foreground">
                  {exposure.value} / {exposure.limit}
                </span>
              </span>
              <StatusBadge label={exposure.status.label} tone={exposure.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Exposures are produced by the external risk model — never calculated by this console.
      </p>
    </InfoCard>
  );
}

/** Risk constraints. */
export function ConstraintsPanel({ constraints }: { constraints: readonly ConstraintVm[] }) {
  return (
    <InfoCard title="Constraints">
      {constraints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No constraints.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {constraints.map((constraint) => (
            <li
              key={constraint.id}
              className="flex items-start justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-medium">{constraint.label}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {constraint.bound}
                </span>
                {constraint.note ? (
                  <p className="text-xs text-muted-foreground">{constraint.note}</p>
                ) : null}
              </span>
              <StatusBadge label={constraint.status.label} tone={constraint.status.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Risk indicators overview — supplied values (nothing computed here). */
export function MetricsOverview({ metrics }: { metrics: readonly MetricVm[] }) {
  return (
    <InfoCard title="Risk indicators">
      {metrics.length === 0 ? (
        <p className="text-sm text-muted-foreground">No indicators yet.</p>
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
        Indicators are reported by the risk model (no VaR/CVaR/stress computed here) — surfaced,
        never calculated.
      </p>
    </InfoCard>
  );
}

/** Risk Validation. */
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

/** Risk Exceptions. */
export function ExceptionsPanel({ exceptions }: { exceptions: readonly ExceptionVm[] }) {
  return (
    <InfoCard title="Exceptions">
      {exceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No exceptions raised.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {exceptions.map((exception) => (
            <li key={exception.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="font-mono text-xs text-muted-foreground">{exception.code}</span>{' '}
                <span className="font-medium">{exception.reason}</span>
                <p className="text-xs text-muted-foreground">
                  by {exception.raisedBy} · {exception.raisedLabel}
                  {exception.expiresLabel ? ` · expires ${exception.expiresLabel}` : ''}
                  {exception.ruleRef ? ` · rule ${exception.ruleRef}` : ''}
                </p>
              </span>
              <StatusBadge label={exception.status.label} tone={exception.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Exception disposition is a governance decision — recorded here, never made by this console.
      </p>
    </InfoCard>
  );
}

/** Risk Overrides. */
export function OverridesPanel({ overrides }: { overrides: readonly OverrideVm[] }) {
  return (
    <InfoCard title="Overrides">
      {overrides.length === 0 ? (
        <p className="text-sm text-muted-foreground">No overrides recorded.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {overrides.map((override) => (
            <li key={override.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{override.reason}</span>
                <p className="text-xs text-muted-foreground">
                  by {override.authorizedBy} · counter-signed {override.counterSignedBy} ·{' '}
                  {override.grantedLabel}
                  {override.expiresLabel ? ` · expires ${override.expiresLabel}` : ''}
                </p>
              </span>
              <StatusBadge label={override.status.label} tone={override.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Overrides are time-boxed and counter-signed by authorized humans — recorded here, never
        auto-applied.
      </p>
    </InfoCard>
  );
}

/** Risk reviews. */
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

/** Risk approvals (decided by governance). */
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
                {approval.counterSignedBy ? (
                  <p className="text-xs text-muted-foreground">
                    counter-signed by {approval.counterSignedBy}
                  </p>
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
        Approval is a governance decision by accountable humans — recorded here, never made by this
        console.
      </p>
    </InfoCard>
  );
}

/** Risk Reports. */
export function ReportsPanel({ reports }: { reports: readonly ReportVm[] }) {
  return (
    <InfoCard title="Reports">
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {reports.map((report) => (
            <li key={report.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{report.title}</span>{' '}
                <StatusBadge label={report.kind} tone="info" />
                <p className="text-xs text-muted-foreground">{report.summary}</p>
                <span className="font-mono text-[11px] text-muted-foreground">{report.ref}</span>
              </span>
              <span className="text-xs text-muted-foreground">{report.generatedLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Risk Audit Timeline. */
export function AuditTimelinePanel({ audit }: { audit: readonly AuditVm[] }) {
  return (
    <InfoCard title="Audit timeline">
      {audit.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audit entries.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {audit.map((entry) => (
            <li key={entry.id} className="border-b py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <StatusBadge label={entry.kind} tone="neutral" />
                  <span className="font-medium">{entry.action}</span>
                </span>
                <span className="text-xs text-muted-foreground">{entry.occurredLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.actor} · {entry.detail}
              </p>
            </li>
          ))}
        </ol>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        The audit trail is tamper-evident and append-only — recorded by the Audit Center.
      </p>
    </InfoCard>
  );
}

/** Risk Dependencies — cross-linked inputs. */
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

/** Risk Lineage — provenance across the research chain. */
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

/** Risk Versions. */
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

/** Risk Snapshots. */
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
                <StatusBadge label={snapshot.decision.label} tone={snapshot.decision.tone} />
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
