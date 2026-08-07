/**
 * `SynchronizationStateMachine` — the deterministic account-synchronization lifecycle:
 * `UNINITIALIZED → INITIALIZING → SNAPSHOT_LOADING → SYNCHRONIZING → SYNCHRONIZED`, with
 * `DEGRADED → RECOVERING → SYNCHRONIZED` recovery and a terminal-ish `FAILED`. It enforces that only
 * defined transitions occur so account state is never silently corrupted by an out-of-band change, and
 * emits a change event through an injected listener. The clock is injected for deterministic
 * timestamps. It reflects lifecycle only — it decides nothing about account contents.
 */
import type { SynchronizationState } from './canonical';

export interface SyncStateChange {
  readonly previous: SynchronizationState;
  readonly current: SynchronizationState;
  readonly reason: string;
  readonly at: number;
}

export type SyncStateListener = (change: SyncStateChange) => void;

const TRANSITIONS: Readonly<Record<SynchronizationState, readonly SynchronizationState[]>> = {
  UNINITIALIZED: ['INITIALIZING'],
  INITIALIZING: ['SNAPSHOT_LOADING', 'FAILED'],
  SNAPSHOT_LOADING: ['SYNCHRONIZING', 'FAILED', 'DEGRADED'],
  SYNCHRONIZING: ['SYNCHRONIZED', 'DEGRADED', 'FAILED'],
  SYNCHRONIZED: ['DEGRADED', 'RECOVERING', 'FAILED', 'UNINITIALIZED'],
  DEGRADED: ['RECOVERING', 'FAILED', 'UNINITIALIZED'],
  RECOVERING: ['SNAPSHOT_LOADING', 'SYNCHRONIZED', 'DEGRADED', 'FAILED'],
  FAILED: ['INITIALIZING', 'UNINITIALIZED'],
};

export interface SynchronizationStateMachineDeps {
  readonly clock: () => number;
  readonly onChange?: SyncStateListener;
  readonly initial?: SynchronizationState;
}

export class SynchronizationStateMachine {
  private current: SynchronizationState;
  private readonly clock: () => number;
  private readonly onChange?: SyncStateListener;

  constructor(deps: SynchronizationStateMachineDeps) {
    this.current = deps.initial ?? 'UNINITIALIZED';
    this.clock = deps.clock;
    this.onChange = deps.onChange;
  }

  get state(): SynchronizationState {
    return this.current;
  }

  get isSynchronized(): boolean {
    return this.current === 'SYNCHRONIZED';
  }

  canTransition(next: SynchronizationState): boolean {
    return TRANSITIONS[this.current].includes(next);
  }

  /** Transition to `next`; returns the change, or null if it is a no-op or not permitted. */
  transition(next: SynchronizationState, reason: string): SyncStateChange | null {
    if (next === this.current) return null;
    if (!this.canTransition(next)) return null;
    const change: SyncStateChange = {
      previous: this.current,
      current: next,
      reason,
      at: this.clock(),
    };
    this.current = next;
    this.onChange?.(change);
    return change;
  }
}
