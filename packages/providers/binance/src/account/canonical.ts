/**
 * The canonical **account-state domain models** the synchronization layer maintains and publishes —
 * the venue-neutral representation of an account's balances, positions, permissions and status, plus
 * the synchronization lifecycle. It reuses the canonical balance/position element models and the
 * incremental account events already defined by the Authentication & User Data Streams module
 * ({@link ../auth/events}) — those ARE the canonical elements — and adds the aggregate account-state,
 * snapshot and synchronization-status models. All models are immutable (asset-agnostic, CP-8); no
 * Binance field name appears here.
 */
import type {
  AccountBalance,
  AccountPosition,
  AccountUpdatedEvent,
  BalanceUpdatedEvent,
  PositionUpdatedEvent,
} from '../auth/events';
import type { BinanceMarket } from '../constants';

export type { AccountBalance, AccountPosition };

/** Canonical position side. */
export type PositionSide = 'BOTH' | 'LONG' | 'SHORT';

/** Canonical margin state for a position (Futures). */
export interface MarginState {
  readonly marginType: string;
  readonly isolatedWallet: number;
}

/** The canonical account permission set (documented Binance permissions, e.g. `SPOT`, `MARGIN`). */
export type AccountPermission = string;

/** The full canonical account state at a point in time. */
export interface AccountState {
  readonly market: BinanceMarket;
  readonly accountType?: string;
  readonly canTrade?: boolean;
  readonly permissions: readonly AccountPermission[];
  readonly balances: readonly AccountBalance[];
  readonly positions: readonly AccountPosition[];
  /** The venue update time carried by the source snapshot/event (0 when unknown). */
  readonly updateTime: number;
}

/** The canonical account aggregate for a broker binding. */
export interface Account {
  readonly brokerId: string;
  readonly state: AccountState;
  readonly syncedAt: number;
}

/** An immutable account snapshot produced from REST reads. */
export interface AccountSnapshot {
  readonly state: AccountState;
  readonly loadedAt: number;
}

/** The synchronization lifecycle states. */
export type SynchronizationState =
  | 'UNINITIALIZED'
  | 'INITIALIZING'
  | 'SNAPSHOT_LOADING'
  | 'SYNCHRONIZING'
  | 'SYNCHRONIZED'
  | 'DEGRADED'
  | 'RECOVERING'
  | 'FAILED';

/** A point-in-time view of the synchronization status. */
export interface SyncStatus {
  readonly state: SynchronizationState;
  readonly lastSnapshotAt?: number;
  readonly lastEventAt?: number;
  readonly appliedEvents: number;
  readonly droppedEvents: number;
  readonly recoveries: number;
  readonly degradedReason?: string;
}

/**
 * The incremental account events (reused from the user data stream module) the synchronizer consumes.
 * Aliased here for the account-synchronization vocabulary.
 */
export type AccountUpdateEvent = AccountUpdatedEvent;
export type BalanceUpdateEvent = BalanceUpdatedEvent;
export type PositionUpdateEvent = PositionUpdatedEvent;
export type { AccountUpdatedEvent, BalanceUpdatedEvent, PositionUpdatedEvent };

/** Total (free + locked) for a balance. */
export function balanceTotal(balance: AccountBalance): number {
  return balance.free + balance.locked;
}
