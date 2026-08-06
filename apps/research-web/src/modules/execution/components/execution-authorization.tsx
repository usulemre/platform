import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { ExecutionStatusBadge } from './execution-status-badge';
import type { AuthorizationVm, StatusVm, WorkflowStatusVm } from '../domain/view-model';

/**
 * Authorization & workflow panel — the Execution Governance integration at the
 * presentation layer. Shows the time-boxed authorization token, deployment mode,
 * the governed workflow (WFC ref) and whether cancellation is available. Read-only:
 * the console never issues tokens, advances workflows, or executes.
 */
export function ExecutionAuthorization({
  authorization,
  mode,
  workflow,
  cancellable,
}: {
  authorization: AuthorizationVm;
  mode: StatusVm;
  workflow: WorkflowStatusVm;
  cancellable: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Authorization &amp; workflow</CardTitle>
        <ExecutionStatusBadge label={authorization.stateLabel} tone={authorization.tone} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Mode:</span>
          <ExecutionStatusBadge label={mode.label} tone={mode.tone} />
        </p>
        <p>
          <span className="text-muted-foreground">Token:</span>{' '}
          {authorization.tokenRef ? (
            <span className="font-mono text-xs">{authorization.tokenRef}</span>
          ) : (
            <span>Not issued</span>
          )}
        </p>
        {authorization.issuedLabel || authorization.expiresLabel ? (
          <p className="text-muted-foreground">
            {authorization.issuedLabel ? `Issued ${authorization.issuedLabel}` : ''}
            {authorization.expiresLabel ? ` · expires ${authorization.expiresLabel}` : ''}
          </p>
        ) : null}
        <p>
          <span className="text-muted-foreground">Contract:</span>{' '}
          <span className="font-mono text-xs">{workflow.workflowRef}</span> · {workflow.name} ·{' '}
          {workflow.currentStage} ({workflow.stateLabel})
        </p>
        <p className="text-muted-foreground">
          Cancellation: {cancellable ? 'available (governed)' : 'not available'}
        </p>
      </CardContent>
    </Card>
  );
}
