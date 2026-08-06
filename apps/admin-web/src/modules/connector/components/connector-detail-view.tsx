'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useConnector } from '../hooks/use-connectors';
import {
  ConnectorEmpty,
  ConnectorError,
  ConnectorLoading,
  InfoCard,
  KeyValueList,
  PlatformNotice,
  StatusBadge,
} from './connector-atoms';
import {
  ConnectorCapabilities,
  ConnectorConfiguration,
  ConnectorCredentials,
  ConnectorDiagnostics,
  ConnectorHealth,
  ConnectorLogs,
  ConnectorMetrics,
  ConnectorValidation,
} from './panels';
import { ConnectorActivity, ConnectorLifecycle, ConnectorVersions } from './timelines';

/** Connector details container. Orchestrates the detail query and lays out the
 *  metadata, configuration, credentials, capabilities, health, metrics,
 *  diagnostics, validation, lifecycle, activity and version panels. */
export function ConnectorDetailView({ connectorId }: { connectorId: string }) {
  const { data, isLoading, isError, refetch } = useConnector(connectorId);

  if (isLoading) return <ConnectorLoading />;
  if (isError) return <ConnectorError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/connectors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <ConnectorEmpty label="No connector matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to connectors">
          <Link href="/connectors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.id}</span>
        <StatusBadge label={data.type.label} tone={data.type.tone} />
        <StatusBadge label={data.status.label} tone={data.status.tone} />
        <StatusBadge label={data.health.label} tone={data.health.tone} />
        <StatusBadge label={data.environment.label} tone={data.environment.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <PlatformNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Metadata">
          <KeyValueList rows={data.metadata} />
        </InfoCard>
        <ConnectorConfiguration configuration={data.configuration} />
        <ConnectorCapabilities capabilities={data.capabilities} />
        <ConnectorCredentials credentials={data.credentials} />
        <ConnectorHealth health={data.healthDetail} />
        <ConnectorMetrics metrics={data.metrics} />
        <ConnectorDiagnostics diagnostics={data.diagnostics} />
        <ConnectorValidation validation={data.validation} />
        <ConnectorLifecycle steps={data.lifecycle} />
        <ConnectorActivity events={data.activity} />
        <ConnectorVersions versions={data.versions} />
        <ConnectorLogs />
      </div>
    </div>
  );
}
