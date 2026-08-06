/**
 * Canonical AI Agent DTOs — the transport contract mirroring the governed Agent
 * Registry (REG) and Agent Contracts (AGC). Inert data shapes only. Agents
 * PROPOSE and NARRATE; they NEVER decide (CLAUDE.md AI-1..4, REG-9) — the type
 * excludes any `DECIDES` authority. No LLM providers, no model inference, no
 * prompt execution: the model binding is pinned metadata only.
 */
export type AgentStatusDto =
  | 'REGISTERED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'UNDER_EVALUATION'
  | 'DEPRECATED'
  | 'RETIRED';

/** Authority ceiling — advisory only. `DECIDES` is intentionally not permitted. */
export type AgentAuthorityDto = 'PROPOSES' | 'NARRATES' | 'OBSERVES';

export type HealthStatusDto = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export type EvalGateDto = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
export type DriftStatusDto = 'STABLE' | 'DRIFTING' | 'NOT_MONITORED';

export type ValidationStatusDto = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
export type ValidationSeverityDto = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssueDto {
  readonly code: string;
  readonly severity: ValidationSeverityDto;
  readonly message: string;
}

export interface ValidationReportDto {
  readonly status: ValidationStatusDto;
  readonly issues: readonly ValidationIssueDto[];
  readonly checkedAt?: string;
}

/** Pinned Model Registry binding (metadata only — no inference performed here). */
export interface ModelBindingDto {
  readonly id: string;
  readonly version: string;
  readonly pinned: boolean;
}

export interface WorkflowAssignmentDto {
  readonly workflowRef: string;
  readonly name: string;
  readonly role: string;
}

export interface EvaluationDto {
  readonly gate: EvalGateDto;
  readonly score: string;
  readonly drift: DriftStatusDto;
  readonly lastEvaluated?: string;
}

export interface PerformanceDto {
  readonly invocations: string;
  readonly avgLatency: string;
  readonly costToDate: string;
  readonly tokensToDate: string;
}

export interface HealthDto {
  readonly status: HealthStatusDto;
  readonly message: string;
  readonly lastSeen: string;
}

export interface LifecycleEventDto {
  readonly stage: string;
  readonly label: string;
  readonly occurredAt?: string;
}

export interface ActivityEventDto {
  readonly id: string;
  readonly label: string;
  readonly actor?: string;
  readonly occurredAt: string;
}

export interface AgentVersionDto {
  readonly version: string;
  readonly registeredAt: string;
  readonly note: string;
}

export interface AgentDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly status: AgentStatusDto;
  readonly authority: AgentAuthorityDto;
  readonly owner: string;
  readonly team: string;
  readonly version: string;
  readonly model: ModelBindingDto;
  readonly contractRef: string;
  readonly contractVersion: string;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly workflowAssignments: readonly WorkflowAssignmentDto[];
  readonly evaluation: EvaluationDto;
  readonly performance: PerformanceDto;
  readonly health: HealthDto;
  readonly validation: ValidationReportDto;
  readonly lifecycle: readonly LifecycleEventDto[];
  readonly activity: readonly ActivityEventDto[];
  readonly versions: readonly AgentVersionDto[];
  readonly registryId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly registeredAt?: string;
  readonly retiredAt?: string;
  readonly tags: readonly string[];
}
