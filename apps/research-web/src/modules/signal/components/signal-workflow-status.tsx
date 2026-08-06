import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { SignalStatusBadge } from './signal-status-badge';
import type { ApprovalVm, EligibilityVm, WorkflowStatusVm } from '../domain/view-model';

/**
 * Approval, workflow and execution-eligibility panel. Read-only: it shows the
 * governed approval workflow (Workflow Engine, WFC ref) and the execution
 * eligibility owned by Execution Governance. The console never approves,
 * advances a workflow, or executes.
 */
export function SignalWorkflowStatus({
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
        <SignalStatusBadge label={approval.label} tone={approval.tone} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{approval.detail}</p>
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Execution:</span>
          <SignalStatusBadge label={eligibility.label} tone={eligibility.tone} />
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
