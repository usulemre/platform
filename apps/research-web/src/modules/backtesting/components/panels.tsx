import Link from 'next/link';
import { cn } from '@platform/utils';
import { InfoCard, KeyValueList, ProgressBar, StatusBadge } from './backtesting-atoms';
import type {
  ApprovalVm,
  ArtifactVm,
  ConfigurationVm,
  DependencyVm,
  LineageVm,
  MetricVm,
  ResultVm,
  ReportVm,
  ReviewVm,
  RunControlVm,
  RunVm,
  SessionVm,
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

/** Backtest lifecycle timeline (draft → archived). */
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

/** Run status + progress + available run controls (advisory availability only). */
export function RunPanel({ run, controls }: { run: RunVm; controls: readonly RunControlVm[] }) {
  return (
    <InfoCard title="Run" action={<StatusBadge label={run.status.label} tone={run.status.tone} />}>
      <div className="space-y-3 text-sm">
        <ProgressBar
          progress={{
            percent: run.progressPercent,
            label: `${run.progressPercent}%`,
            currentStageLabel: `Attempt ${run.attempt}`,
          }}
          ariaLabel="Run progress"
        />
        <p className="text-muted-foreground">{run.note}</p>
        <KeyValueList
          rows={[
            { label: 'Started', value: run.startedLabel ?? '—' },
            { label: 'Ended', value: run.endedLabel ?? '—' },
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
            Cancel / retry / pause / resume are governed run controls, executed by the runner —
            availability shown here.
          </p>
        </div>
      </div>
    </InfoCard>
  );
}

/** Backtest configuration — scenario, window, cost model and parameter sets. */
export function ConfigurationPanel({ configuration }: { configuration: ConfigurationVm }) {
  return (
    <InfoCard title="Configuration">
      <div className="space-y-3 text-sm">
        <div className="rounded-md border p-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{configuration.scenario.label}</span>
            <StatusBadge label={configuration.scenario.kind.replace('_', ' ')} tone="info" />
          </div>
          <p className="text-xs text-muted-foreground">
            {configuration.scenario.window} · {configuration.scenario.description}
          </p>
        </div>
        <KeyValueList rows={configuration.rows} />
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Parameter sets
          </h3>
          {configuration.parameterSets.length === 0 ? (
            <p className="text-muted-foreground">None defined.</p>
          ) : (
            <ul className="space-y-1">
              {configuration.parameterSets.map((set) => (
                <li key={set.id} className="border-b py-1">
                  <span className="font-medium">{set.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {set.params.map((param) => `${param.label}=${param.value}`).join(', ') || '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {configuration.notes ? (
          <p className="text-xs text-muted-foreground">{configuration.notes}</p>
        ) : null}
      </div>
    </InfoCard>
  );
}

/** Backtest Metrics Overview — supplied metric values (nothing computed here). */
export function MetricsOverview({ metrics }: { metrics: readonly MetricVm[] }) {
  return (
    <InfoCard title="Metrics overview">
      {metrics.length === 0 ? (
        <p className="text-sm text-muted-foreground">No metrics yet.</p>
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
        Metric values are produced by the simulation runner and reported here — never computed by
        this console.
      </p>
    </InfoCard>
  );
}

/** Backtest Validation. */
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

/** Backtest results per parameter set (values supplied, not computed). */
export function ResultsPanel({ results }: { results: readonly ResultVm[] }) {
  return (
    <InfoCard title="Results">
      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No results yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {results.map((result) => (
            <li key={result.id} className="border-b py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{result.summary}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {result.parameterSetId}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {result.metrics.map((metric) => (
                  <span key={metric.key} className="rounded-md border px-2 py-0.5 text-xs">
                    {metric.label}: <span className="font-medium">{metric.value}</span>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Backtest Reports. */
export function ReportsPanel({ reports }: { reports: readonly ReportVm[] }) {
  return (
    <InfoCard title="Reports">
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {reports.map((report) => (
            <li key={report.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{report.title}</span>
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

/** Backtest Sessions. */
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

/** Backtest Dependencies — cross-linked inputs. */
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

/** Backtest Lineage — provenance across the research chain. */
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

/** Backtest Artifacts. */
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

/** Backtest reviews. */
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

/** Backtest approvals (decided by governance). */
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

/** Backtest Versions. */
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
