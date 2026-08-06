import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { PortfolioStatusBadge } from './portfolio-status-badge';
import type { ApprovalVm, DeploymentVm, WorkflowStatusVm } from '../domain/view-model';

/**
 * Approval, review workflow and deployment-mode panel. Read-only: it shows the
 * governed portfolio-construction workflow (Workflow Engine, WFC ref) and the
 * deployment mode owned by Execution Governance. The console never approves,
 * advances a workflow, or authorizes live trading.
 */
export function PortfolioWorkflowStatus({
  approval,
  deployment,
  workflow,
}: {
  approval: ApprovalVm;
  deployment: DeploymentVm;
  workflow: WorkflowStatusVm;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Approval &amp; deployment</CardTitle>
        <PortfolioStatusBadge label={approval.label} tone={approval.tone} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{approval.detail}</p>
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Deployment:</span>
          <PortfolioStatusBadge label={deployment.label} tone={deployment.tone} />
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
