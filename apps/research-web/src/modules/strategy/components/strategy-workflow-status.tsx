import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { StrategyStatusBadge } from './strategy-status-badge';
import type { ApprovalVm, EligibilityVm, WorkflowStatusVm } from '../domain/view-model';

/**
 * Approval, review workflow and portfolio-eligibility panel. Read-only: it shows
 * the governed workflow (Workflow Engine, WFC ref) and the portfolio eligibility
 * owned by portfolio governance. The console never approves or advances anything.
 */
export function StrategyWorkflowStatus({
  approval,
  eligibility,
  workflow,
}: {
  approval: ApprovalVm;
  eligibility: EligibilityVm;
  workflow: WorkflowStatusVm;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Approval &amp; eligibility</CardTitle>
        <StrategyStatusBadge label={approval.label} tone={approval.tone} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{approval.detail}</p>
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Portfolio:</span>
          <StrategyStatusBadge label={eligibility.label} tone={eligibility.tone} />
        </p>
        <p>
          <span className="text-muted-foreground">Contract:</span>{' '}
          <span className="font-mono text-xs">{workflow.workflowRef}</span> · {workflow.name} ·{' '}
          {workflow.currentStage} ({workflow.stateLabel})
        </p>
      </CardContent>
    </Card>
  );
}
