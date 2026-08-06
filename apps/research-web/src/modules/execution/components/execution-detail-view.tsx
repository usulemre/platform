'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { NotFound } from '@platform/shell';
import { useExecutionRequest } from '../hooks/use-executions';
import { ExecutionStatusBadge } from './execution-status-badge';
import { AdvisoryNotice } from './advisory-notice';
import { ExecutionMetadataPanel } from './execution-metadata-panel';
import { ExecutionAuthorization } from './execution-authorization';
import { RiskApprovalSummary } from './risk-approval-summary';
import { ExecutionReferences } from './execution-references';
import { ExecutionValidationSummary } from './execution-validation-summary';
import { ExecutionTimeline } from './execution-timeline';
import { ExecutionLoadingState } from './execution-loading-state';
import { ExecutionErrorState } from './execution-error-state';

/** Execution request details container. Orchestrates the detail query and lays
 *  out the authorization, risk approval, references, validation and timeline
 *  panels. This console never executes — the advisory notice is always shown. */
export function ExecutionDetailView({ executionId }: { executionId: string }) {
  const { data, isLoading, isError, refetch } = useExecutionRequest(executionId);

  if (isLoading) return <ExecutionLoadingState />;
  if (isError) return <ExecutionErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <NotFound
        title="Execution request not found"
        description="No execution request matches this identifier."
        homeHref="/execution"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to execution queue">
          <Link href="/execution">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.title}</h1>
        <ExecutionStatusBadge label={data.status.label} tone={data.status.tone} />
        <ExecutionStatusBadge label={data.mode.label} tone={data.mode.tone} />
      </div>
      <AdvisoryNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExecutionMetadataPanel rows={data.metadata} />
        <ExecutionAuthorization
          authorization={data.authorization}
          mode={data.mode}
          workflow={data.workflow}
          cancellable={data.cancellable}
        />
        <RiskApprovalSummary riskApproval={data.riskApproval} />
        <ExecutionReferences references={data.references} />
        <ExecutionValidationSummary validation={data.validation} />
        <ExecutionTimeline steps={data.timeline} />
      </div>
    </div>
  );
}
