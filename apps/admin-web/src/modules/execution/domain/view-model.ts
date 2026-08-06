/**
 * Execution view models — UI-facing, pre-formatted shapes produced by the mappers so components carry
 * no logic. Inert presentation data only; the execution lifecycle logic lives in the Execution Engine
 * service / `@platform/execution-engine-sdk`. No broker/exchange/FIX.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}
export interface MetaRowVm {
  readonly label: string;
  readonly value: string;
}

export interface ExecutionRowVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly quantity: string;
  readonly executed: string;
  readonly remaining: string;
  readonly avgPrice: string;
  readonly status: StatusVm;
  readonly paused: boolean;
  readonly mode: StatusVm;
  readonly venue: string;
  readonly updatedLabel: string;
}

export interface PolicyEvalVm {
  readonly type: string;
  readonly allow: boolean;
  readonly decision: string;
  readonly detail: string;
}
export interface PlanVm {
  readonly strategy: string;
  readonly venue: string;
  readonly mode: StatusVm;
  readonly sliceCount: number;
  readonly sliceQuantity: string;
  readonly priority: number;
  readonly retryLimit: number;
  readonly timeoutSeconds: number;
  readonly throttlePerMinute: number;
  readonly releaseLabel?: string;
  readonly note: string;
  readonly evaluations: readonly PolicyEvalVm[];
}
export interface TaskVm {
  readonly id: string;
  readonly sliceIndex: number;
  readonly quantity: string;
  readonly status: StatusVm;
  readonly venue: string;
}
export interface SliceVm {
  readonly taskId: string;
  readonly quantity: string;
  readonly price: string;
  readonly venue: string;
  readonly atLabel: string;
}
export interface CheckVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
  readonly detail: string;
}
export interface EventVm {
  readonly id: string;
  readonly type: string;
  readonly status?: StatusVm;
  readonly message: string;
  readonly actor: string;
  readonly atLabel: string;
  readonly tone: Tone;
}
export interface StateVm {
  readonly status: StatusVm;
  readonly atLabel: string;
  readonly note: string;
}
export interface AuditVm {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly atLabel: string;
}
export interface ActionVm {
  readonly action: string;
  readonly label: string;
  readonly permitted: boolean;
}
export interface PolicyRefVm {
  readonly type: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly params: string;
}

export interface ExecutionDetailVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly status: StatusVm;
  readonly paused: boolean;
  readonly mode: StatusVm;
  readonly quantity: string;
  readonly executed: string;
  readonly remaining: string;
  readonly avgPrice: string;
  readonly progressPercent: number;
  readonly progressLabel: string;
  readonly validation: StatusVm;
  readonly validationChecks: readonly CheckVm[];
  readonly plan?: PlanVm;
  readonly policies: readonly PolicyRefVm[];
  readonly tasks: readonly TaskVm[];
  readonly slices: readonly SliceVm[];
  readonly events: readonly EventVm[];
  readonly states: readonly StateVm[];
  readonly audit: readonly AuditVm[];
  readonly actions: readonly ActionVm[];
  readonly metadata: readonly MetaRowVm[];
  readonly tags: readonly string[];
  readonly createdLabel: string;
  readonly updatedLabel: string;
}

export interface PolicyDescriptorVm {
  readonly type: string;
  readonly label: string;
  readonly description: string;
  readonly category: string;
  readonly params: readonly {
    readonly name: string;
    readonly label: string;
    readonly defaultValue: number;
    readonly unit: string;
  }[];
}
export interface VenueVm {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly mode: StatusVm;
  readonly description: string;
}
export interface SessionVm {
  readonly id: string;
  readonly label: string;
  readonly mode: StatusVm;
  readonly status: StatusVm;
  readonly executionCount: number;
  readonly openedLabel: string;
  readonly note: string;
}

export interface StatusBucketVm {
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}
export interface MetricsVm {
  readonly total: number;
  readonly active: number;
  readonly working: number;
  readonly completed: number;
  readonly failed: number;
  readonly cancelled: number;
  readonly partiallyExecuted: number;
  readonly paused: number;
  readonly completionRate: string;
  readonly failRate: string;
  readonly fillCompletion: string;
  readonly averageSlices: string;
  readonly byStatus: readonly StatusBucketVm[];
}
export interface HealthCheckVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
  readonly detail: string;
}
export interface HealthVm {
  readonly status: StatusVm;
  readonly checks: readonly HealthCheckVm[];
}
export interface ReplayStepVm {
  readonly index: number;
  readonly type: string;
  readonly from: StatusVm;
  readonly to: StatusVm;
  readonly legal: boolean;
  readonly actor: string;
  readonly atLabel: string;
  readonly message: string;
}
export interface ReplayVm {
  readonly executionId: string;
  readonly clientOrderId: string;
  readonly reconstructedStatus: StatusVm;
  readonly recordedStatus: StatusVm;
  readonly consistent: boolean;
  readonly steps: readonly ReplayStepVm[];
}
export interface TimelineRowVm extends EventVm {
  readonly executionId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
}
export interface AuditRowVm extends AuditVm {
  readonly executionId: string;
  readonly clientOrderId: string;
}
export interface ExecutionSummaryVm {
  readonly total: number;
  readonly active: number;
  readonly working: number;
  readonly completed: number;
  readonly failed: number;
  readonly cancelled: number;
  readonly byStatus: readonly StatusBucketVm[];
}
export interface PlanPreviewVm {
  readonly plan: PlanVm;
  readonly tasks: readonly TaskVm[];
  readonly validationPassed: boolean;
  readonly checks: readonly CheckVm[];
}
