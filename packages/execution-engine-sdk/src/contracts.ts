/**
 * The canonical **execution domain models** — the single source of truth for the shapes the
 * Execution Engine service and its UIs exchange. Immutable, provenance-bearing data shapes. Numeric
 * quantities/prices are execution bookkeeping (slices, executed/remaining, average execution price);
 * standard execution arithmetic, NOT market data or PnL. NO broker/exchange/FIX, NO transport.
 */
import type { ExecutionAction, ExecutionEventType, ExecutionStatus } from './lifecycle';
import type { ExecutionMode, PolicyEvaluation, PolicyType, VenueKind } from './policies';

export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
export type PlanStrategy = 'IMMEDIATE' | 'SCHEDULED' | 'TIME_WINDOW' | 'SLICED';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

/** A configured policy on an execution request. */
export interface ExecutionPolicy {
  readonly type: PolicyType;
  readonly enabled: boolean;
  readonly params: Readonly<Record<string, number>>;
}

/** Provenance + free-form metadata. */
export interface ExecutionMetadata {
  readonly source: string;
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly portfolioId?: string;
  readonly strategyId?: string;
  readonly sessionId?: string;
  readonly tags: readonly string[];
  readonly entries: readonly MetadataEntry[];
}

/** A single validation check. */
export interface ValidationCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface ExecutionValidation {
  readonly status: ValidationStatus;
  readonly checks: readonly ValidationCheck[];
  readonly validatedAt?: string;
}

/** The execution request received from the OMS. */
export interface ExecutionRequest {
  readonly id: string;
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly orderType: string;
  readonly limitPrice?: number;
  readonly mode: ExecutionMode;
  readonly priority: number;
  readonly policies: readonly ExecutionPolicy[];
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly metadata: ExecutionMetadata;
}

/** The deterministic execution plan produced from a request and its policies. */
export interface ExecutionPlan {
  readonly id: string;
  readonly requestId: string;
  readonly strategy: PlanStrategy;
  readonly venue: string;
  readonly venueKind: VenueKind;
  readonly mode: ExecutionMode;
  readonly sliceCount: number;
  readonly sliceQuantity: number;
  readonly priority: number;
  readonly retryLimit: number;
  readonly timeoutSeconds: number;
  readonly throttlePerMinute: number;
  readonly releaseAt?: string;
  readonly windowStartMinute?: number;
  readonly windowEndMinute?: number;
  readonly policyEvaluations: readonly PolicyEvaluation[];
  readonly plannedAt: string;
  readonly note: string;
}

/** A child execution task (one slice). */
export interface ExecutionTask {
  readonly id: string;
  readonly sliceIndex: number;
  readonly quantity: number;
  readonly executedQuantity: number;
  readonly status: ExecutionStatus;
  readonly venue: string;
  readonly attempts: number;
}

/** A single slice execution report. */
export interface SliceResult {
  readonly taskId: string;
  readonly quantity: number;
  readonly price: number;
  readonly venue: string;
  readonly at: string;
}

/** The execution result — slice reports and the derived execution summary. */
export interface ExecutionResult {
  readonly executedQuantity: number;
  readonly remainingQuantity: number;
  readonly averagePrice?: number;
  readonly slices: readonly SliceResult[];
  readonly lastExecutionAt?: string;
  readonly venue: string;
}

/** A lifecycle event on the execution timeline. */
export interface ExecutionEvent {
  readonly id: string;
  readonly type: ExecutionEventType;
  readonly status?: ExecutionStatus;
  readonly action?: ExecutionAction;
  readonly message: string;
  readonly actor: string;
  readonly at: string;
  readonly detail?: string;
}

/** A status-snapshot entry in the execution's state history (for replay). */
export interface ExecutionState {
  readonly status: ExecutionStatus;
  readonly at: string;
  readonly note: string;
}

/** A tamper-evident audit entry. */
export interface ExecutionAudit {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly at: string;
}

/** The full state + event history of an execution (reconstructable via replay). */
export interface ExecutionTimeline {
  readonly executionId: string;
  readonly states: readonly ExecutionState[];
  readonly events: readonly ExecutionEvent[];
}

export interface ExecutionOwner {
  readonly owner: string;
  readonly team: string;
  readonly desk: string;
}

/** The execution aggregate — the complete lifecycle state of one execution. */
export interface Execution {
  readonly id: string;
  readonly requestId: string;
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly orderType: string;
  readonly limitPrice?: number;
  readonly mode: ExecutionMode;
  readonly status: ExecutionStatus;
  readonly paused: boolean;
  readonly priority: number;
  readonly attempts: number;
  readonly policies: readonly ExecutionPolicy[];
  readonly plan?: ExecutionPlan;
  readonly validation: ExecutionValidation;
  readonly result: ExecutionResult;
  readonly tasks: readonly ExecutionTask[];
  readonly events: readonly ExecutionEvent[];
  readonly states: readonly ExecutionState[];
  readonly audit: readonly ExecutionAudit[];
  readonly metadata: ExecutionMetadata;
  readonly tags: readonly string[];
  readonly sessionId?: string;
  readonly owner: ExecutionOwner;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type SessionStatus = 'OPEN' | 'ACTIVE' | 'CLOSED';

/** An execution session — a governed batch/run of executions. */
export interface ExecutionSession {
  readonly id: string;
  readonly label: string;
  readonly mode: ExecutionMode;
  readonly status: SessionStatus;
  readonly executionIds: readonly string[];
  readonly openedBy: string;
  readonly openedAt: string;
  readonly closedAt?: string;
  readonly note: string;
}

/** Aggregate execution metrics (a computed shape). */
export interface ExecutionMetrics {
  readonly total: number;
  readonly active: number;
  readonly working: number;
  readonly completed: number;
  readonly failed: number;
  readonly cancelled: number;
  readonly partiallyExecuted: number;
  readonly paused: number;
  readonly completionRate: number;
  readonly failRate: number;
  readonly cancelRate: number;
  readonly fillCompletion: number;
  readonly totalQuantity: number;
  readonly executedQuantity: number;
  readonly averageSlices: number;
  readonly byStatus: readonly { readonly status: ExecutionStatus; readonly count: number }[];
}
