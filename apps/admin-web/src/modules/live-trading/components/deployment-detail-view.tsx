'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useDeployment } from '../hooks/use-live-trading';
import {
  TradingEmpty,
  TradingError,
  TradingLoading,
  GovernanceNotice,
  InfoCard,
  KeyValueList,
  ProgressBar,
  StatusBadge,
  TagList,
} from './trading-atoms';
import {
  AccountPanel,
  ApprovalsPanel,
  AuditPanel,
  AuthorizationPanel,
  BalancesPanel,
  ConnectionPanel,
  DependenciesPanel,
  EmergencyPanel,
  HealthPanel,
  LifecycleTimeline,
  LineagePanel,
  MetricsOverview,
  OrderExplorer,
  PermissionsPanel,
  PortfolioPanel,
  PositionExplorer,
  RuntimePanel,
  SessionPanel,
  SnapshotsPanel,
  TimelinePanel,
  ValidationPanel,
  VersionsPanel,
} from './panels';

/** Deployment details — the full record for one deployment: lifecycle, runtime + controls,
 *  account, connection, session, authorization, orders, positions, portfolio, balances,
 *  permissions, health, metrics, timeline, approvals, emergency controls + kill switch,
 *  validation, dependencies, lineage, audit, versions, snapshots, links and metadata. */
export function DeploymentDetailView({ deploymentId }: { deploymentId: string }) {
  const { data, isLoading, isError, refetch } = useDeployment(deploymentId);

  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/live-trading">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <TradingEmpty label="No deployment matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to live trading">
          <Link href="/live-trading">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.key}</span>
        <StatusBadge label={data.mode.label} tone={data.mode.tone} />
        <StatusBadge label={data.stage.label} tone={data.stage.tone} />
        <StatusBadge label={`v${data.version}`} tone="neutral" />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <div className="max-w-md">
        <ProgressBar progress={data.progress} ariaLabel="Lifecycle progress" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Runtime: ${data.runtime.status.label}`}
          tone={data.runtime.status.tone}
        />
        <StatusBadge label={`Health: ${data.health.status.label}`} tone={data.health.status.tone} />
        <StatusBadge
          label={`Kill switch: ${data.killSwitch.status.label}`}
          tone={data.killSwitch.status.tone}
        />
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
        <RuntimePanel runtime={data.runtime} controls={data.runtimeControls} />
        <AccountPanel account={data.account} />
        <ConnectionPanel connection={data.connection} />
        {data.session ? <SessionPanel session={data.session} /> : null}
        {data.authorization ? <AuthorizationPanel authorization={data.authorization} /> : null}
      </div>

      <EmergencyPanel actions={data.emergencyActions} killSwitch={data.killSwitch} />

      <OrderExplorer orders={data.orders} />
      <PositionExplorer positions={data.positions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PortfolioPanel portfolio={data.portfolio} />
        <BalancesPanel balances={data.balances} />
        <HealthPanel health={data.health} />
        <PermissionsPanel permissions={data.permissions} />
        <TimelinePanel timeline={data.timeline} />
        <ApprovalsPanel approvals={data.approvals} />
        <ValidationPanel validation={data.validation} />
        <DependenciesPanel dependencies={data.dependencies} />
        <LineagePanel lineage={data.lineage} />
        <VersionsPanel versions={data.versions} />
        <SnapshotsPanel snapshots={data.snapshots} />
      </div>

      <AuditPanel audit={data.audit} />

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
