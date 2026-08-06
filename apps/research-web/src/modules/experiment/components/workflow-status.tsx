import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { ExperimentStatusBadge } from './experiment-status-badge';
import type { WorkflowStatusVm } from '../domain/view-model';

/**
 * Workflow status panel — the Workflow Engine integration at the presentation
 * layer. Read-only: it shows the governed workflow (WFC ref) gating this
 * experiment and its current stage. The console never advances a workflow.
 */
export function WorkflowStatusPanel({ workflow }: { workflow: WorkflowStatusVm }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Workflow</CardTitle>
        <ExperimentStatusBadge label={workflow.stateLabel} tone={workflow.tone} />
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Contract:</span>{' '}
          <span className="font-mono text-xs">{workflow.workflowRef}</span> · {workflow.name}
        </p>
        <p>
          <span className="text-muted-foreground">Current stage:</span> {workflow.currentStage}
        </p>
      </CardContent>
    </Card>
  );
}
