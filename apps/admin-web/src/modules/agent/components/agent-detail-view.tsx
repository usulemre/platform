'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useAgent } from '../hooks/use-agents';
import { AgentEmpty, AgentError, AgentLoading, GovernanceNotice, StatusBadge } from './agent-atoms';
import {
  AgentCapabilities,
  AgentContracts,
  AgentMetadataPanel,
  AgentValidationSummary,
  EvaluationResults,
  HealthStatus,
  PerformanceSummary,
  WorkflowAssignments,
} from './panels';
import { ActivityTimeline, AgentLifecycle, AgentVersions } from './timelines';

/** Agent details container. Orchestrates the detail query and lays out the
 *  metadata, capabilities, contracts, workflow, evaluation, performance, health,
 *  validation, lifecycle, activity and version panels. */
export function AgentDetailView({ agentId }: { agentId: string }) {
  const { data, isLoading, isError, refetch } = useAgent(agentId);

  if (isLoading) return <AgentLoading />;
  if (isError) return <AgentError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/agents">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <AgentEmpty label="No agent matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to agents">
          <Link href="/agents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.id}</span>
        <StatusBadge label={data.status.label} tone={data.status.tone} />
        <StatusBadge label={data.authority.label} tone={data.authority.tone} />
        <StatusBadge label={data.health.label} tone={data.health.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <GovernanceNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AgentMetadataPanel rows={data.metadata} />
        <AgentContracts contracts={data.contracts} />
        <AgentCapabilities capabilities={data.capabilities} permissions={data.permissions} />
        <WorkflowAssignments assignments={data.workflowAssignments} />
        <EvaluationResults evaluation={data.evaluation} />
        <PerformanceSummary performance={data.performance} />
        <HealthStatus health={data.healthDetail} />
        <AgentValidationSummary validation={data.validation} />
        <AgentLifecycle steps={data.lifecycle} />
        <ActivityTimeline events={data.activity} />
        <AgentVersions versions={data.versions} />
      </div>
    </div>
  );
}
