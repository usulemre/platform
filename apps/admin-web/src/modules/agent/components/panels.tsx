import { Badge } from '@platform/ui';
import { InfoCard, KeyValueList, StatusBadge } from './agent-atoms';
import type {
  EvaluationVm,
  HealthVm,
  MetadataRowVm,
  PerformanceVm,
  ValidationVm,
  WorkflowAssignmentVm,
} from '../domain/view-model';

/** Agent metadata + ownership + model binding. */
export function AgentMetadataPanel({ rows }: { rows: readonly MetadataRowVm[] }) {
  return (
    <InfoCard title="Metadata">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Agent capabilities and permissions (bus ACLs). */
export function AgentCapabilities({
  capabilities,
  permissions,
}: {
  capabilities: readonly string[];
  permissions: readonly string[];
}) {
  return (
    <InfoCard title="Capabilities & permissions">
      <div className="space-y-3 text-sm">
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Capabilities
          </h3>
          {capabilities.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {capabilities.map((capability) => (
                <Badge key={capability} variant="secondary">
                  {capability}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">None declared.</p>
          )}
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Permissions (bus ACLs)
          </h3>
          {permissions.length > 0 ? (
            <ul className="space-y-0.5">
              {permissions.map((permission) => (
                <li key={permission} className="font-mono text-xs text-muted-foreground">
                  {permission}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No permissions granted.</p>
          )}
        </div>
      </div>
    </InfoCard>
  );
}

/** Agent contracts (Agent Contracts + authority ceiling + model binding). */
export function AgentContracts({ contracts }: { contracts: readonly MetadataRowVm[] }) {
  return (
    <InfoCard title="Contracts">
      <KeyValueList rows={contracts} />
    </InfoCard>
  );
}

/** Workflow assignments (Workflow Engine / Workflow Contracts). */
export function WorkflowAssignments({
  assignments,
}: {
  assignments: readonly WorkflowAssignmentVm[];
}) {
  return (
    <InfoCard title="Workflow assignments">
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not assigned to any workflow.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {assignments.map((assignment) => (
            <li
              key={assignment.workflowRef}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-mono text-xs">{assignment.workflowRef}</span> ·{' '}
                {assignment.name}
              </span>
              <span className="text-xs uppercase text-muted-foreground">{assignment.role}</span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Evaluation results (AI Agent Evaluation Framework — golden-set gate + drift). */
export function EvaluationResults({ evaluation }: { evaluation: EvaluationVm }) {
  return (
    <InfoCard title="Evaluation">
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Gate:</span>
          <StatusBadge label={evaluation.gate.label} tone={evaluation.gate.tone} />
        </p>
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Drift:</span>
          <StatusBadge label={evaluation.drift.label} tone={evaluation.drift.tone} />
        </p>
        <p>
          <span className="text-muted-foreground">Score:</span> {evaluation.score}
        </p>
        {evaluation.lastEvaluatedLabel ? (
          <p className="text-xs text-muted-foreground">
            Last evaluated {evaluation.lastEvaluatedLabel}
          </p>
        ) : null}
      </div>
    </InfoCard>
  );
}

/** Performance summary (pre-supplied operational metrics; nothing computed). */
export function PerformanceSummary({ performance }: { performance: PerformanceVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Invocations', value: performance.invocations },
    { label: 'Avg latency', value: performance.avgLatency },
    { label: 'Cost to date', value: performance.costToDate },
    { label: 'Tokens to date', value: performance.tokensToDate },
  ];
  return (
    <InfoCard title="Performance">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Health status panel. */
export function HealthStatus({ health }: { health: HealthVm }) {
  return (
    <InfoCard title="Health">
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <StatusBadge label={health.status.label} tone={health.status.tone} />
          <span className="text-xs text-muted-foreground">Last seen {health.lastSeenLabel}</span>
        </p>
        <p className="text-muted-foreground">{health.message}</p>
      </div>
    </InfoCard>
  );
}

/** Agent config validation summary (Validation Foundation). */
export function AgentValidationSummary({ validation }: { validation: ValidationVm }) {
  return (
    <InfoCard title="Validation">
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <StatusBadge label={validation.label} tone={validation.tone} />
          <span className="text-xs text-muted-foreground">
            {validation.checkedLabel ? `Checked ${validation.checkedLabel}` : 'Not checked'} ·{' '}
            {validation.issueCount} issue{validation.issueCount === 1 ? '' : 's'}
          </span>
        </p>
        {validation.issueCount > 0 ? (
          <ul className="space-y-1">
            {validation.issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="flex items-start gap-2">
                <StatusBadge label={issue.severity} tone={issue.tone} />
                <span>
                  <span className="font-mono text-xs text-muted-foreground">{issue.code}</span>{' '}
                  {issue.message}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No issues reported.</p>
        )}
      </div>
    </InfoCard>
  );
}
