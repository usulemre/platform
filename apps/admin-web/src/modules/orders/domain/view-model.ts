/**
 * Orders view models — UI-facing, pre-formatted shapes produced by the mappers so components carry
 * no logic. Inert presentation data only; the order lifecycle logic lives in the OMS service /
 * `@platform/order-sdk`. No broker/exchange/FIX.
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

export interface OrderRowVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly type: string;
  readonly quantity: string;
  readonly filled: string;
  readonly remaining: string;
  readonly avgPrice: string;
  readonly status: StatusVm;
  readonly suspended: boolean;
  readonly mode: StatusVm;
  readonly updatedLabel: string;
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

export interface ApprovalVm {
  readonly id: string;
  readonly role: string;
  readonly status: StatusVm;
  readonly decidedBy?: string;
  readonly decidedLabel?: string;
  readonly rationale?: string;
}

export interface FillVm {
  readonly id: string;
  readonly quantity: string;
  readonly price: string;
  readonly liquidity: string;
  readonly venue: string;
  readonly atLabel: string;
}

export interface RouteVm {
  readonly venue: string;
  readonly destination: string;
  readonly mode: StatusVm;
  readonly gatewayRef: string;
  readonly routedLabel?: string;
}

export interface ActionVm {
  readonly action: string;
  readonly label: string;
  readonly permitted: boolean;
}

export interface OrderDetailVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly type: string;
  readonly typeLabel: string;
  readonly status: StatusVm;
  readonly suspended: boolean;
  readonly mode: StatusVm;
  readonly version: number;
  readonly quantity: string;
  readonly filled: string;
  readonly remaining: string;
  readonly avgPrice: string;
  readonly limitPrice: string;
  readonly stopPrice: string;
  readonly timeInForce: string;
  readonly fillPercentLabel: string;
  readonly fillPercent: number;
  readonly validation: StatusVm;
  readonly validationChecks: readonly CheckVm[];
  readonly approvals: readonly ApprovalVm[];
  readonly route?: RouteVm;
  readonly fills: readonly FillVm[];
  readonly events: readonly EventVm[];
  readonly states: readonly StateVm[];
  readonly audit: readonly AuditVm[];
  readonly actions: readonly ActionVm[];
  readonly metadata: readonly MetaRowVm[];
  readonly tags: readonly string[];
  readonly owner: { readonly owner: string; readonly team: string; readonly desk: string };
  readonly createdLabel: string;
  readonly updatedLabel: string;
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
  readonly filled: number;
  readonly partiallyFilled: number;
  readonly rejected: number;
  readonly cancelled: number;
  readonly expired: number;
  readonly suspended: number;
  readonly fillRate: string;
  readonly rejectRate: string;
  readonly cancelRate: string;
  readonly fillCompletion: string;
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
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly reconstructedStatus: StatusVm;
  readonly recordedStatus: StatusVm;
  readonly consistent: boolean;
  readonly steps: readonly ReplayStepVm[];
}

export interface TimelineRowVm extends EventVm {
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
}

export interface AuditRowVm extends AuditVm {
  readonly orderId: string;
  readonly clientOrderId: string;
}

export interface OrdersSummaryVm {
  readonly total: number;
  readonly active: number;
  readonly working: number;
  readonly completed: number;
  readonly filled: number;
  readonly rejected: number;
  readonly cancelled: number;
  readonly byStatus: readonly StatusBucketVm[];
}
