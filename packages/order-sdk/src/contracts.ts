/**
 * The canonical **order domain models** — the single source of truth for the shapes the Order
 * Management Service and its UIs exchange. Immutable, provenance-bearing data shapes. Numeric
 * quantities/prices are order bookkeeping (fills, remaining, average execution price); this is
 * standard OMS arithmetic, NOT market-data or PnL computation. NO broker/exchange/FIX, NO transport.
 */
import type { OrderAction, OrderEventType, OrderStatus } from './lifecycle';
import type { OrderSide, OrderType, TimeInForce } from './order-types';

export type ExecutionMode = 'PAPER' | 'SIMULATED' | 'LIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';
export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
export type Liquidity = 'MAKER' | 'TAKER' | 'UNKNOWN';

/** A key/value metadata entry. */
export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

/** Order provenance and free-form metadata. */
export interface OrderMetadata {
  readonly source: string;
  readonly strategyId?: string;
  readonly portfolioId?: string;
  readonly signalId?: string;
  readonly optimizationRunId?: string;
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

/** The pre-trade validation record. */
export interface OrderValidation {
  readonly status: ValidationStatus;
  readonly checks: readonly ValidationCheck[];
  readonly validatedAt?: string;
}

/** An approval decision on an order. */
export interface OrderApproval {
  readonly id: string;
  readonly role: string;
  readonly status: ApprovalStatus;
  readonly decidedBy?: string;
  readonly decidedAt?: string;
  readonly rationale?: string;
}

/** The routing record (to an execution venue abstraction — never a real broker/FIX endpoint). */
export interface OrderRoute {
  readonly venue: string;
  readonly destination: string;
  readonly mode: ExecutionMode;
  readonly gatewayRef: string;
  readonly routedAt?: string;
}

/** A single fill (partial or full). */
export interface OrderFill {
  readonly id: string;
  readonly quantity: number;
  readonly price: number;
  readonly liquidity: Liquidity;
  readonly venue: string;
  readonly at: string;
}

/** The execution aggregate — fills and the derived execution summary. */
export interface OrderExecution {
  readonly filledQuantity: number;
  readonly remainingQuantity: number;
  readonly averagePrice?: number;
  readonly lastFillAt?: string;
  readonly fills: readonly OrderFill[];
  readonly route?: OrderRoute;
}

/** A lifecycle event on the order timeline. */
export interface OrderEvent {
  readonly id: string;
  readonly type: OrderEventType;
  readonly status?: OrderStatus;
  readonly action?: OrderAction;
  readonly message: string;
  readonly actor: string;
  readonly at: string;
  readonly detail?: string;
}

/** A status-snapshot entry in the order's state history (for replay). */
export interface OrderState {
  readonly status: OrderStatus;
  readonly at: string;
  readonly note: string;
}

/** A tamper-evident audit entry. */
export interface OrderAudit {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly at: string;
}

/** The full state + event history of an order (reconstructable via replay). */
export interface OrderHistory {
  readonly orderId: string;
  readonly states: readonly OrderState[];
  readonly events: readonly OrderEvent[];
}

/** An owner record. */
export interface OrderOwner {
  readonly owner: string;
  readonly team: string;
  readonly desk: string;
}

/** An order request — the immutable input that creates an order. */
export interface OrderRequest {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: number;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly trailingAmount?: number;
  readonly displayQuantity?: number;
  readonly timeInForce: TimeInForce;
  readonly account: string;
  readonly mode: ExecutionMode;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly metadata: OrderMetadata;
}

/** The order aggregate — the single source of truth for one order's complete lifecycle state. */
export interface Order {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: number;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly trailingAmount?: number;
  readonly displayQuantity?: number;
  readonly timeInForce: TimeInForce;
  readonly status: OrderStatus;
  /** Whether the order is currently suspended (held) — a runtime flag, not a status. */
  readonly suspended: boolean;
  readonly mode: ExecutionMode;
  readonly account: string;
  readonly priority: number;
  readonly version: number;
  readonly execution: OrderExecution;
  readonly validation: OrderValidation;
  readonly approvals: readonly OrderApproval[];
  readonly route?: OrderRoute;
  readonly events: readonly OrderEvent[];
  readonly states: readonly OrderState[];
  readonly audit: readonly OrderAudit[];
  readonly metadata: OrderMetadata;
  readonly tags: readonly string[];
  readonly owner: OrderOwner;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt?: string;
}
