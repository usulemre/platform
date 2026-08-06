import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { FeatureStatusBadge } from './feature-status-badge';
import type { ApprovalVm, WorkflowStatusVm } from '../domain/view-model';

/**
 * Approval & workflow panel — the Workflow Engine integration at the presentation
 * layer. Shows the approval state and the governed workflow (WFC ref) gating it.
 * Read-only: approval and progression happen through the workflow, never here.
 */
export function FeatureWorkflowStatus({
  approval,
  workflow,
}: {
  approval: ApprovalVm;
  workflow: WorkflowStatusVm;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Approval &amp; workflow</CardTitle>
        <FeatureStatusBadge label={approval.label} tone={approval.tone} />
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="text-muted-foreground">{approval.detail}</p>
        <p>
          <span className="text-muted-foreground">Contract:</span>{' '}
          <span className="font-mono text-xs">{workflow.workflowRef}</span> · {workflow.name}
        </p>
        <p>
          <span className="text-muted-foreground">Stage:</span> {workflow.currentStage} ·{' '}
          {workflow.stateLabel}
        </p>
      </CardContent>
    </Card>
  );
}
