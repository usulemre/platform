import Link from 'next/link';
import { cn } from '@platform/utils';
import { InfoCard, KeyValueList, ProgressBar, StatusBadge } from './execution-atoms';
import type {
  ApprovalVm,
  ArtifactVm,
  DependencyVm,
  FillVm,
  LineageVm,
  MetricVm,
  OrderVm,
  PortfolioVm,
  PositionVm,
  ReplayVm,
  ReportVm,
  ReviewVm,
  RunControlVm,
  RunVm,
  ScenarioVm,
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

/** Simulation lifecycle timeline (draft → archived). */
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
            Pause / resume / retry / cancel / replay are governed run controls executed by the
            simulator — availability shown here.
          </p>
        </div>
      </div>
    </InfoCard>
  );
}

/** Scenario configuration. */
export function ScenarioPanel({ scenario }: { scenario: ScenarioVm }) {
  return (
    <InfoCard title="Scenario">
      <div className="space-y-3 text-sm">
        <p className="font-medium">{scenario.label}</p>
        <KeyValueList rows={scenario.rows} />
        {scenario.parameters.length > 0 ? (
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Parameters
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {scenario.parameters.map((param) => (
                <span key={param.label} className="rounded-md border px-2 py-0.5 text-xs">
                  {param.label}={param.value}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {scenario.notes ? <p className="text-xs text-muted-foreground">{scenario.notes}</p> : null}
      </div>
    </InfoCard>
  );
}

/** Order Explorer — simulated orders (states inert). */
export function OrderExplorer({ orders }: { orders: readonly OrderVm[] }) {
  return (
    <InfoCard title="Order explorer">
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Order</th>
                <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
                <th className="px-3 py-1.5 text-left font-medium">Side</th>
                <th className="px-3 py-1.5 text-left font-medium">Type</th>
                <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                <th className="px-3 py-1.5 text-right font-medium">Limit</th>
                <th className="px-3 py-1.5 text-right font-medium">Filled</th>
                <th className="px-3 py-1.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    {order.clientOrderId}
                  </td>
                  <td className="px-3 py-1.5 font-medium">{order.symbol}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge label={order.side.label} tone={order.side.tone} />
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">{order.type}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{order.quantity}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{order.limitPrice}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{order.filledQuantity}</td>
                  <td className="px-3 py-1.5 text-right">
                    <StatusBadge label={order.status.label} tone={order.status.tone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Order states are simulated by the simulator — reflected here, never submitted to a real
        venue.
      </p>
    </InfoCard>
  );
}

/** Fill Explorer — simulated fills (values inert). */
export function FillExplorer({ fills }: { fills: readonly FillVm[] }) {
  return (
    <InfoCard title="Fill explorer">
      {fills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fills.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
                <th className="px-3 py-1.5 text-left font-medium">Side</th>
                <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                <th className="px-3 py-1.5 text-right font-medium">Price</th>
                <th className="px-3 py-1.5 text-left font-medium">Liquidity</th>
                <th className="px-3 py-1.5 text-left font-medium">Venue</th>
                <th className="px-3 py-1.5 text-right font-medium">Filled</th>
              </tr>
            </thead>
            <tbody>
              {fills.map((fill) => (
                <tr key={fill.id} className="border-t">
                  <td className="px-3 py-1.5 font-medium">{fill.symbol}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge label={fill.side.label} tone={fill.side.tone} />
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">{fill.quantity}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{fill.price}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{fill.liquidity}</td>
                  <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    {fill.venue}
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs text-muted-foreground">
                    {fill.filledLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Fills are produced by the simulator (simulated venue) — never from a real exchange.
      </p>
    </InfoCard>
  );
}

/** Position Explorer — simulated positions (values inert). */
export function PositionExplorer({ positions }: { positions: readonly PositionVm[] }) {
  return (
    <InfoCard title="Position explorer">
      {positions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No positions.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
                <th className="px-3 py-1.5 text-left font-medium">Side</th>
                <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                <th className="px-3 py-1.5 text-right font-medium">Avg price</th>
                <th className="px-3 py-1.5 text-right font-medium">Market value</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id} className="border-t">
                  <td className="px-3 py-1.5 font-medium">{position.symbol}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge label={position.side.label} tone={position.side.tone} />
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">{position.quantity}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{position.averagePrice}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{position.marketValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  );
}

/** Simulated portfolio state. */
export function PortfolioPanel({ portfolio }: { portfolio: PortfolioVm }) {
  return (
    <InfoCard title="Portfolio state">
      <KeyValueList rows={portfolio.rows} />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Portfolio state is reflected from the simulator (values supplied) — no PnL is computed by
        this console.
      </p>
    </InfoCard>
  );
}

/** Order Timeline — ordered execution events. */
export function TimelinePanel({ timeline }: { timeline: readonly TimelineEventVm[] }) {
  return (
    <InfoCard title="Order timeline">
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

/** Execution Metrics overview — supplied indicator values (nothing computed here). */
export function MetricsOverview({ metrics }: { metrics: readonly MetricVm[] }) {
  return (
    <InfoCard title="Execution metrics">
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
        Slippage / latency and other metrics are SIMULATED figures reported by the simulator — never
        computed here.
      </p>
    </InfoCard>
  );
}

/** Execution Replay history. */
export function ReplayPanel({ replays }: { replays: readonly ReplayVm[] }) {
  return (
    <InfoCard title="Replay">
      {replays.length === 0 ? (
        <p className="text-sm text-muted-foreground">No replays.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {replays.map((replay) => (
            <li key={replay.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{replay.note}</span>
                <p className="text-xs text-muted-foreground">{replay.createdLabel}</p>
              </span>
              <StatusBadge label={replay.status.label} tone={replay.status.tone} />
            </li>
          ))}
        </ul>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Replay re-simulates a completed session deterministically in the simulator — never on a real
        venue.
      </p>
    </InfoCard>
  );
}

/** Execution validation. */
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

/** Execution reports. */
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

/** Execution artifacts. */
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

/** Simulation reviews. */
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

/** Simulation approvals (decided by governance). */
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

/** Execution dependencies — cross-linked inputs. */
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

/** Execution Lineage — provenance across the research chain. */
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

/** Execution Versions. */
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

/** Execution Snapshots. */
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
