import Link from 'next/link';
import { cn } from '@platform/utils';
import { InfoCard, KeyValueList, StatusBadge } from './trading-atoms';
import type {
  AccountVm,
  ApprovalVm,
  AuditVm,
  AuthorizationVm,
  BalanceVm,
  ConnectionVm,
  DependencyVm,
  EmergencyActionVm,
  HealthVm,
  KillSwitchVm,
  LineageVm,
  MetricVm,
  OrderVm,
  PermissionVm,
  PortfolioVm,
  PositionVm,
  RuntimeControlVm,
  RuntimeVm,
  SessionVm,
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

/** Deployment lifecycle timeline (candidate → archived). */
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

/** Reusable control-chip renderer — emergency controls are visually distinct. */
export function ControlChips({ controls }: { controls: readonly RuntimeControlVm[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {controls.map((control) => (
        <span
          key={control.control}
          className={cn(
            'rounded-md border px-2 py-0.5 text-xs',
            control.emergency
              ? control.enabled
                ? 'border-destructive font-medium text-destructive'
                : 'border-muted-foreground/30 text-muted-foreground line-through'
              : control.enabled
                ? 'border-primary text-foreground'
                : 'border-muted-foreground/30 text-muted-foreground line-through',
          )}
        >
          {control.label}
        </span>
      ))}
    </div>
  );
}

/** Runtime status + mode + available controls (advisory availability only). */
export function RuntimePanel({
  runtime,
  controls,
}: {
  runtime: RuntimeVm;
  controls: readonly RuntimeControlVm[];
}) {
  return (
    <InfoCard
      title="Runtime"
      action={<StatusBadge label={runtime.status.label} tone={runtime.status.tone} />}
    >
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <StatusBadge label={`Mode: ${runtime.mode.label}`} tone={runtime.mode.tone} />
          <span className="text-xs text-muted-foreground">uptime {runtime.uptime}</span>
        </div>
        <p className="text-muted-foreground">{runtime.note}</p>
        <KeyValueList rows={[{ label: 'Started', value: runtime.startedLabel ?? '—' }]} />
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Available controls
          </h3>
          <ControlChips controls={controls} />
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Runtime controls are executed by the broker gateway; emergency stop and the kill switch
            are always available to authorized humans — shown here, never executed by this console.
          </p>
        </div>
      </div>
    </InfoCard>
  );
}

/** Trading account. */
export function AccountPanel({ account }: { account: AccountVm }) {
  return (
    <InfoCard
      title="Account"
      action={<StatusBadge label={account.status.label} tone={account.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <p className="font-medium">{account.name}</p>
        <KeyValueList
          rows={[
            { label: 'Broker kind', value: account.brokerKind },
            { label: 'Provider', value: account.provider },
            { label: 'Base currency', value: account.baseCurrency },
          ]}
        />
        <StatusBadge label={`Mode: ${account.mode.label}`} tone={account.mode.tone} />
      </div>
    </InfoCard>
  );
}

/** Broker/exchange connection abstraction. */
export function ConnectionPanel({ connection }: { connection: ConnectionVm }) {
  return (
    <InfoCard
      title="Connection"
      action={<StatusBadge label={connection.status.label} tone={connection.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <p className="font-medium">{connection.label}</p>
        <KeyValueList
          rows={[
            { label: 'Provider', value: connection.provider },
            { label: 'Broker kind', value: connection.brokerKind },
            { label: 'Credential', value: connection.credentialRef },
          ]}
        />
        <StatusBadge label={`Mode: ${connection.mode.label}`} tone={connection.mode.tone} />
        <p role="note" className="text-xs text-muted-foreground">
          Connection is an abstraction; the credential is an opaque reference resolved by the
          secrets broker — never held here.
        </p>
      </div>
    </InfoCard>
  );
}

/** Trading session. */
export function SessionPanel({ session }: { session: SessionVm }) {
  return (
    <InfoCard
      title="Session"
      action={<StatusBadge label={session.mode.label} tone={session.mode.tone} />}
    >
      <div className="space-y-2 text-sm">
        <p className="font-medium">{session.label}</p>
        <KeyValueList
          rows={[
            { label: 'Started', value: session.startedLabel },
            { label: 'Ended', value: session.endedLabel ?? '—' },
          ]}
        />
        <p className="text-xs text-muted-foreground">{session.note}</p>
      </div>
    </InfoCard>
  );
}

/** Authorization token (required for live). */
export function AuthorizationPanel({ authorization }: { authorization: AuthorizationVm }) {
  return (
    <InfoCard
      title="Authorization"
      action={<StatusBadge label={authorization.valid.label} tone={authorization.valid.tone} />}
    >
      <div className="space-y-2 text-sm">
        <KeyValueList
          rows={[
            { label: 'Scope', value: authorization.scope },
            { label: 'Issued by', value: authorization.issuedBy },
            { label: 'Issued', value: authorization.issuedLabel },
            { label: 'Expires', value: authorization.expiresLabel },
          ]}
        />
        <span className="font-mono text-[11px] text-muted-foreground">{authorization.ref}</span>
        <p role="note" className="text-xs text-muted-foreground">
          Live execution requires a valid, time-boxed authorization token issued by deployment
          governance.
        </p>
      </div>
    </InfoCard>
  );
}

function OrderTable({ orders }: { orders: readonly OrderVm[] }) {
  return (
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
  );
}

export { OrderTable };

/** Production orders. */
export function OrderExplorer({ orders }: { orders: readonly OrderVm[] }) {
  return (
    <InfoCard title="Production orders">
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders.</p>
      ) : (
        <OrderTable orders={orders} />
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Order states are orchestrated through the broker gateway abstraction — reflected here, never
        transmitted by this console.
      </p>
    </InfoCard>
  );
}

function PositionTable({ positions }: { positions: readonly PositionVm[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
            <th className="px-3 py-1.5 text-left font-medium">Side</th>
            <th className="px-3 py-1.5 text-right font-medium">Qty</th>
            <th className="px-3 py-1.5 text-right font-medium">Avg price</th>
            <th className="px-3 py-1.5 text-right font-medium">Market value</th>
            <th className="px-3 py-1.5 text-right font-medium">Unrealized</th>
            <th className="px-3 py-1.5 text-right font-medium">Realized</th>
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
              <td className="px-3 py-1.5 text-right font-mono">{position.unrealizedPnl}</td>
              <td className="px-3 py-1.5 text-right font-mono">{position.realizedPnl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { PositionTable };

/** Positions (open + closed). */
export function PositionExplorer({ positions }: { positions: readonly PositionVm[] }) {
  return (
    <InfoCard title="Positions">
      {positions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No positions.</p>
      ) : (
        <PositionTable positions={positions} />
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Position and PnL values are reported by upstream systems — never computed by this console.
      </p>
    </InfoCard>
  );
}

/** Portfolio overview. */
export function PortfolioPanel({ portfolio }: { portfolio: PortfolioVm }) {
  return (
    <InfoCard title="Portfolio">
      <KeyValueList rows={portfolio.rows} />
    </InfoCard>
  );
}

/** Account balances. */
export function BalancesPanel({ balances }: { balances: readonly BalanceVm[] }) {
  return (
    <InfoCard title="Balances">
      {balances.length === 0 ? (
        <p className="text-sm text-muted-foreground">No balances.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {balances.map((balance) => (
            <li key={balance.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span className="font-medium">{balance.asset}</span>
              <span className="font-mono text-xs text-muted-foreground">
                total {balance.total} · avail {balance.available} · reserved {balance.reserved}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Trading permissions. */
export function PermissionsPanel({ permissions }: { permissions: readonly PermissionVm[] }) {
  return (
    <InfoCard title="Permissions">
      {permissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No permissions.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {permissions.map((permission) => (
            <li
              key={permission.id}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-medium">{permission.capability}</span>{' '}
                <span className="text-xs text-muted-foreground">{permission.note}</span>
              </span>
              <StatusBadge label={permission.granted.label} tone={permission.granted.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Production health. */
export function HealthPanel({ health }: { health: HealthVm }) {
  return (
    <InfoCard
      title="Production health"
      action={<StatusBadge label={health.status.label} tone={health.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          {health.note}
          {health.checkedLabel ? ` · checked ${health.checkedLabel}` : ''}
        </p>
        {health.checks.length === 0 ? (
          <p className="text-muted-foreground">No checks.</p>
        ) : (
          <ul className="space-y-1">
            {health.checks.map((check) => (
              <li key={check.id} className="flex items-center justify-between gap-4 border-b py-1">
                <span>
                  <span className="font-medium">{check.label}</span>{' '}
                  <span className="text-xs text-muted-foreground">{check.detail}</span>
                </span>
                <StatusBadge label={check.status.label} tone={check.status.tone} />
              </li>
            ))}
          </ul>
        )}
        <p role="note" className="text-xs text-muted-foreground">
          Health is reported by the Monitoring Module — reflected here, never computed by this
          console.
        </p>
      </div>
    </InfoCard>
  );
}

/** Trading metrics overview. */
export function MetricsOverview({ metrics }: { metrics: readonly MetricVm[] }) {
  return (
    <InfoCard title="Trading metrics">
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
        Metrics (incl. PnL) are reported by upstream systems — never computed by this console.
      </p>
    </InfoCard>
  );
}

/** Trading timeline. */
export function TimelinePanel({ timeline }: { timeline: readonly TimelineEventVm[] }) {
  return (
    <InfoCard title="Trading timeline">
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

/** Deployment approvals (risk + deployment). */
export function ApprovalsPanel({ approvals }: { approvals: readonly ApprovalVm[] }) {
  return (
    <InfoCard title="Approvals">
      {approvals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No approvals requested.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {approvals.map((approval) => (
            <li key={approval.id} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <StatusBadge label={approval.kind} tone="info" />{' '}
                <span className="font-medium">{approval.role}</span>
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
        Risk and deployment approvals are governance decisions — recorded here, never made by this
        console.
      </p>
    </InfoCard>
  );
}

/** Emergency actions history + kill switch (always-available human authority). */
export function EmergencyPanel({
  actions,
  killSwitch,
}: {
  actions: readonly EmergencyActionVm[];
  killSwitch: KillSwitchVm;
}) {
  return (
    <InfoCard
      title="Emergency controls & kill switch"
      action={
        <StatusBadge
          label={`Kill switch: ${killSwitch.status.label}`}
          tone={killSwitch.status.tone}
        />
      }
    >
      <div className="space-y-3 text-sm">
        <KeyValueList
          rows={[
            { label: 'Armed by', value: killSwitch.armedBy },
            { label: 'Engaged by', value: killSwitch.engagedBy ?? '—' },
            { label: 'Engaged at', value: killSwitch.engagedLabel ?? '—' },
          ]}
        />
        <p className="text-xs text-muted-foreground">{killSwitch.note}</p>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Emergency action history
          </h3>
          {actions.length === 0 ? (
            <p className="text-muted-foreground">No emergency actions.</p>
          ) : (
            <ul className="space-y-1">
              {actions.map((action) => (
                <li
                  key={action.id}
                  className="flex items-start justify-between gap-4 border-b py-1"
                >
                  <span>
                    <StatusBadge label={action.kind.label} tone="danger" />{' '}
                    <span className="text-xs text-muted-foreground">
                      {action.reason} · {action.actor}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{action.atLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p role="note" className="text-xs text-muted-foreground">
          The kill switch and emergency stop are always available to authorized humans and are never
          gated by AI (HO-4).
        </p>
      </div>
    </InfoCard>
  );
}

/** Deployment validation. */
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

/** Deployment dependencies — cross-linked inputs. */
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

/** Deployment lineage — provenance across the research chain. */
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

/** Trading audit timeline. */
export function AuditPanel({ audit }: { audit: readonly AuditVm[] }) {
  return (
    <InfoCard title="Audit">
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

/** Deployment versions. */
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

/** Deployment snapshots. */
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
