/**
 * `BinanceAccountSynchronizer` — the orchestration facade for canonical account-state synchronization.
 * It implements the documented flow: initial REST snapshot → subscribe to user-data account events →
 * incremental updates (de-duplicated & ordered) → reconciliation → periodic consistency verification →
 * snapshot recovery when required, driven by the {@link SynchronizationStateMachine}. It prefers
 * explicit snapshot recovery over silently accepting inconsistent state: a stale/out-of-order event, a
 * stream reconnect, or a failed consistency check all trigger a fresh snapshot and reconciliation. It
 * exposes ONLY canonical models and reads only — no orders. Every side effect (clock, scheduler, event
 * source) is injected, so behaviour is deterministic under test.
 *
 * Thread-safety: JavaScript is single-threaded; snapshot loads, event application and state transitions
 * happen without interleaving awaits inside a critical section, so observers see consistent state.
 */
import type { Cancel, Scheduler } from '@platform/http-client';
import { SynchronizationStateMachine, type SyncStateChange } from './state-machine';
import { SequenceValidator } from './sequence-validator';
import { BinanceBalanceSynchronizer } from './balance-synchronizer';
import { BinancePositionSynchronizer } from './position-synchronizer';
import { EventProcessor, type IncrementalAccountEvent } from './event-processor';
import { StateReconciler, type ConsistencyReport } from './reconciler';
import { SyncMetrics } from './metrics';
import { AccountErrorMapper } from './error-mapper';
import type { AccountSnapshotManager } from './snapshot-manager';
import type { BinanceMarket } from '../constants';
import type { Account, AccountState, SyncStatus } from './canonical';

/** The minimal event source the synchronizer consumes (satisfied by the `UserDataStream`). */
export interface AccountEventSource {
  on(kind: 'accountUpdated', handler: (event: IncrementalAccountEvent) => void): () => void;
  on(kind: 'balanceUpdated', handler: (event: IncrementalAccountEvent) => void): () => void;
  on(kind: 'positionUpdated', handler: (event: IncrementalAccountEvent) => void): () => void;
  onReconnect?(handler: () => void): () => void;
}

export interface BinanceAccountSynchronizerDeps {
  readonly market: BinanceMarket;
  readonly brokerId: string;
  readonly snapshotManager: AccountSnapshotManager;
  readonly eventSource: AccountEventSource;
  readonly clock: () => number;
  /** Optional scheduler for periodic consistency verification. */
  readonly scheduler?: Scheduler;
  readonly verifyIntervalMs?: number;
  readonly onStateChange?: (change: SyncStateChange) => void;
  readonly onError?: (error: Error) => void;
}

export class BinanceAccountSynchronizer {
  readonly market: BinanceMarket;
  private readonly deps: BinanceAccountSynchronizerDeps;
  private readonly stateMachine: SynchronizationStateMachine;
  private readonly sequence = new SequenceValidator();
  private readonly balanceSync = new BinanceBalanceSynchronizer();
  private readonly positionSync = new BinancePositionSynchronizer();
  private readonly reconciler = new StateReconciler();
  private readonly metrics = new SyncMetrics();
  private readonly errors = new AccountErrorMapper();
  private readonly processor: EventProcessor;
  private readonly clock: () => number;
  private unsub: (() => void)[] = [];
  private verifyTimer?: Cancel;
  private running = false;
  private degradedReason?: string;
  private lastUpdateTime = 0;

  constructor(deps: BinanceAccountSynchronizerDeps) {
    this.deps = deps;
    this.market = deps.market;
    this.clock = deps.clock;
    this.stateMachine = new SynchronizationStateMachine({
      clock: deps.clock,
      onChange: deps.onStateChange,
    });
    this.processor = new EventProcessor({
      sequence: this.sequence,
      balances: this.balanceSync,
      positions: this.positionSync,
      onOutcome: (_event, decision) => {
        this.metrics.onEvent(decision, this.clock());
        if (decision === 'stale') this.onStaleEvent();
      },
    });
  }

  /* ------------------------------ lifecycle ------------------------------ */

  /** The current synchronization state. */
  get state() {
    return this.stateMachine.state;
  }

  /** Whether the maintained state is fully synchronized. */
  get isSynchronized(): boolean {
    return this.stateMachine.isSynchronized;
  }

  /** Start synchronization: subscribe, load the initial snapshot, then apply live events. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.stateMachine.transition('INITIALIZING', 'start');
    this.subscribe();
    try {
      await this.loadSnapshot('initial');
      this.stateMachine.transition('SYNCHRONIZING', 'snapshot-loaded');
      this.stateMachine.transition('SYNCHRONIZED', 'live');
      this.scheduleVerify();
    } catch (error) {
      this.fail(error as Error);
      throw this.errors.map(error);
    }
  }

  /** Stop synchronization and release subscriptions/timers. */
  stop(): void {
    this.running = false;
    this.verifyTimer?.();
    this.verifyTimer = undefined;
    for (const off of this.unsub) off();
    this.unsub = [];
    this.stateMachine.transition('UNINITIALIZED', 'stop');
  }

  private subscribe(): void {
    const source = this.deps.eventSource;
    this.unsub = [
      source.on('accountUpdated', (event) => this.onEvent(event)),
      source.on('balanceUpdated', (event) => this.onEvent(event)),
      source.on('positionUpdated', (event) => this.onEvent(event)),
    ];
    if (source.onReconnect)
      this.unsub.push(source.onReconnect(() => void this.recover('reconnect')));
  }

  /* ------------------------------ snapshot & reconcile ------------------------------ */

  private async loadSnapshot(reason: string): Promise<AccountState> {
    this.stateMachine.transition('SNAPSHOT_LOADING', reason);
    const snapshot = await this.deps.snapshotManager.load();
    this.reconciler.reconcile(this.balanceSync, this.positionSync, snapshot.state);
    this.metrics.onSnapshot(snapshot.loadedAt);
    this.lastUpdateTime = snapshot.state.updateTime;
    // Events at or before the snapshot's update time are already reflected; seed the sequence.
    this.sequence.set(snapshot.state.updateTime);
    return snapshot.state;
  }

  /**
   * Recover by reloading the authoritative snapshot and reconciling. Used on stale events, stream
   * reconnects, and failed consistency checks — explicit recovery over silent inconsistency.
   */
  async recover(reason: string): Promise<void> {
    if (!this.running || this.stateMachine.state === 'RECOVERING') return;
    this.degradedReason = reason;
    this.stateMachine.transition('DEGRADED', reason);
    this.stateMachine.transition('RECOVERING', reason);
    this.metrics.onRecover();
    try {
      await this.loadSnapshot(reason);
      this.metrics.onReconcile();
      this.degradedReason = undefined;
      this.stateMachine.transition('SYNCHRONIZING', 'reconciled');
      this.stateMachine.transition('SYNCHRONIZED', 'recovered');
    } catch (error) {
      this.onError(error as Error);
      if (this.errors.isRecoverable(error))
        this.stateMachine.transition('DEGRADED', 'recovery-failed');
      else this.fail(error as Error);
    }
  }

  /** Run a consistency check against a fresh snapshot; recover if it diverges. */
  async verify(): Promise<ConsistencyReport> {
    const snapshot = await this.deps.snapshotManager.load();
    const report = this.reconciler.verify(snapshot.state, {
      balances: this.balanceSync.all(),
      positions: this.positionSync.all(),
    });
    this.metrics.onSnapshot(snapshot.loadedAt);
    if (!report.consistent) await this.recover('consistency-check');
    return report;
  }

  /* ------------------------------ event application ------------------------------ */

  private onEvent(event: IncrementalAccountEvent): void {
    // Apply live events only when fully synchronized; snapshot/recovery windows are covered by the
    // authoritative snapshot and the seeded sequence, so pre-sync events are intentionally skipped.
    if (!this.running || this.stateMachine.state !== 'SYNCHRONIZED') return;
    this.processor.process(event);
    if ('lastUpdateTime' in event && typeof event.lastUpdateTime === 'number')
      this.lastUpdateTime = Math.max(this.lastUpdateTime, event.lastUpdateTime);
  }

  private onStaleEvent(): void {
    // A stale/out-of-order event means we may have missed one: recover from snapshot.
    void this.recover('stale-event');
  }

  /* ------------------------------ read models ------------------------------ */

  /** The current canonical account state. */
  accountState(): AccountState {
    const snapshot = this.deps.snapshotManager.current();
    return {
      market: this.market,
      accountType: snapshot?.state.accountType,
      canTrade: snapshot?.state.canTrade,
      permissions: snapshot?.state.permissions ?? [],
      balances: this.balanceSync.all(),
      positions: this.positionSync.all(),
      updateTime: this.lastUpdateTime,
    };
  }

  /** The current canonical account aggregate. */
  account(): Account {
    return { brokerId: this.deps.brokerId, state: this.accountState(), syncedAt: this.clock() };
  }

  /** The maintained balances. */
  balances() {
    return this.balanceSync.all();
  }

  /** The maintained positions (Futures). */
  positions() {
    return this.positionSync.all();
  }

  /* ------------------------------ observability ------------------------------ */

  syncStatus(): SyncStatus {
    return this.metrics.status(this.stateMachine.state, this.degradedReason);
  }

  metricsSnapshot() {
    return this.metrics.snapshot();
  }

  private scheduleVerify(): void {
    if (!this.deps.scheduler || !this.deps.verifyIntervalMs) return;
    this.verifyTimer = this.deps.scheduler.schedule(() => {
      this.verifyTimer = undefined;
      if (!this.running) return;
      void this.verify().finally(() => this.scheduleVerify());
    }, this.deps.verifyIntervalMs);
  }

  private onError(error: Error): void {
    this.deps.onError?.(this.errors.map(error));
  }

  private fail(error: Error): void {
    this.onError(error);
    this.stateMachine.transition('FAILED', error.message);
  }
}
