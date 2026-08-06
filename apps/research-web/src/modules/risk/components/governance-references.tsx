import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { RiskStatusBadge } from './risk-status-badge';
import type {
  ExceptionVm,
  PolicyReferenceVm,
  StatusVm,
  WorkflowStatusVm,
} from '../domain/view-model';

/**
 * Governance references — risk policy references (Risk Management Rulebook), the
 * governed approval workflow (Workflow Engine), any recorded risk exceptions, and
 * the advisory execution recommendation (Execution Governance). All read-only.
 */
export function GovernanceReferences({
  policyRefs,
  exceptions,
  workflow,
  executionRecommendation,
}: {
  policyRefs: readonly PolicyReferenceVm[];
  exceptions: readonly ExceptionVm[];
  workflow: WorkflowStatusVm;
  executionRecommendation: StatusVm;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance references</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Approval workflow
          </h3>
          <p className="flex items-center gap-2">
            <span className="font-mono text-xs">{workflow.workflowRef}</span> · {workflow.name} ·{' '}
            {workflow.currentStage}
            <RiskStatusBadge label={workflow.stateLabel} tone={workflow.tone} />
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Execution recommendation
          </h3>
          <p className="flex items-center gap-2">
            <RiskStatusBadge
              label={executionRecommendation.label}
              tone={executionRecommendation.tone}
            />
            <span className="text-xs text-muted-foreground">
              advisory · token-gated by Execution Governance
            </span>
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Risk policy references
          </h3>
          {policyRefs.length === 0 ? (
            <p className="text-muted-foreground">No policy references.</p>
          ) : (
            <ul className="space-y-1">
              {policyRefs.map((ref) => (
                <li
                  key={ref.code}
                  className="flex items-center justify-between gap-4 border-b py-1"
                >
                  <span className="font-mono text-xs text-muted-foreground">{ref.code}</span>
                  <span>{ref.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Risk exceptions</h3>
          {exceptions.length === 0 ? (
            <p className="text-muted-foreground">No recorded exceptions.</p>
          ) : (
            <ul className="space-y-1">
              {exceptions.map((exception) => (
                <li
                  key={exception.code}
                  className="flex items-start justify-between gap-2 border-b py-1"
                >
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {exception.code}
                    </span>{' '}
                    {exception.description}
                  </span>
                  <RiskStatusBadge label={exception.statusLabel} tone={exception.tone} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
