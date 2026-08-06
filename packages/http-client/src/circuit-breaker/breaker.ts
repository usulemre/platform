/**
 * `CircuitBreaker` — the deterministic state machine that protects a single provider. It permits or
 * short-circuits calls based on the current state, records outcomes into the sliding window, opens on
 * unhealthy statistics, probes recovery via HALF_OPEN after the recovery timeout, and closes again on
 * successful trials. It supports operator overrides (forced-open / forced-closed / disabled) and a
 * manual reset. All side effects — time — are injected via `clock`, so behavior is fully reproducible.
 *
 * Thread-safety note: JavaScript is single-threaded; `tryAcquire` and `record` are synchronous with no
 * `await` between reading and mutating state, so each is atomic within the event loop and concurrent
 * in-flight requests observe a consistent circuit state.
 */
import { HttpCircuitOpenError, HttpTransportError, isHttpError } from '../errors';
import { classifyForCircuit } from './classification';
import { CircuitEventEmitter, type CircuitEventListener } from './events';
import { HealthEvaluator } from './health';
import { CircuitMetrics, type CircuitMetricsSnapshot } from './metrics';
import { RecoveryManager } from './recovery';
import { CircuitStateMachine } from './state-machine';
import { createWindow, type CircuitPolicy } from './policy';
import { FailureTracker, SuccessTracker, type FailureSnapshot } from './trackers';
import type { CircuitState } from './state';
import type { Clock } from '../client';
import type { RetryOutcome } from '../retry/classify';
import type { HttpRequest } from '../request';
import type { HttpResponse } from '../response';

/** A permit returned by `tryAcquire`; carries whether the call is allowed and if it is a trial. */
export interface CircuitPermit {
  readonly allowed: boolean;
  readonly state: CircuitState;
  readonly halfOpenTrial: boolean;
  readonly reason?: string;
}

export interface CircuitBreakerSnapshot extends FailureSnapshot {
  readonly name: string;
  readonly state: CircuitState;
  readonly halfOpenInFlight: number;
  readonly halfOpenSuccesses: number;
  readonly openedAt: number | undefined;
  readonly metrics: CircuitMetricsSnapshot;
}

export interface CircuitBreakerDeps {
  readonly clock?: Clock;
  readonly emitter?: CircuitEventEmitter;
}

export class CircuitBreaker {
  readonly name: string;
  private readonly policy: CircuitPolicy;
  private readonly clock: Clock;
  private readonly emitter: CircuitEventEmitter;
  private readonly metrics = new CircuitMetrics();
  private readonly stateMachine: CircuitStateMachine;
  private readonly failureTracker: FailureTracker;
  private readonly successTracker = new SuccessTracker();
  private readonly health = new HealthEvaluator();
  private readonly recovery = new RecoveryManager();
  private openedAt: number | undefined;
  private halfOpenInFlight = 0;

  constructor(name: string, policy: CircuitPolicy, deps: CircuitBreakerDeps = {}) {
    this.name = name;
    this.policy = policy;
    this.clock = deps.clock ?? Date.now;
    this.emitter = deps.emitter ?? new CircuitEventEmitter();
    this.stateMachine = new CircuitStateMachine(name, this.emitter, 'CLOSED');
    this.failureTracker = new FailureTracker(createWindow(policy.window));
  }

  get state(): CircuitState {
    return this.stateMachine.state;
  }

  /** Subscribe to circuit events; returns an unsubscribe function. */
  on(listener: CircuitEventListener): () => void {
    return this.emitter.on(listener);
  }

  /* ------------------------------ permit / record ------------------------------ */

  /** Decide whether a call may proceed, transitioning OPEN → HALF_OPEN lazily when recovery is due. */
  tryAcquire(now: number = this.clock()): CircuitPermit {
    const state = this.stateMachine.state;
    switch (state) {
      case 'DISABLED':
        return { allowed: true, state, halfOpenTrial: false };
      case 'FORCED_CLOSED':
      case 'CLOSED':
        return this.permitted(state, false);
      case 'FORCED_OPEN':
        return this.rejected(state, 'forced-open');
      case 'OPEN':
        if (
          this.openedAt !== undefined &&
          this.recovery.isRecoveryDue(this.openedAt, now, this.policy)
        ) {
          this.toHalfOpen(now);
          this.halfOpenInFlight = 1;
          return this.permitted('HALF_OPEN', true);
        }
        return this.rejected('OPEN', 'open');
      case 'HALF_OPEN':
        if (this.halfOpenInFlight < this.policy.halfOpenMaxCalls) {
          this.halfOpenInFlight += 1;
          return this.permitted('HALF_OPEN', true);
        }
        return this.rejected('HALF_OPEN', 'half-open-limit');
    }
  }

  /** Record the outcome of a permitted call, driving the state machine. */
  record(permit: CircuitPermit, outcome: RetryOutcome, now: number = this.clock()): void {
    if (!permit.allowed) return;
    if (this.stateMachine.state === 'DISABLED') return;

    const verdict = classifyForCircuit(outcome, this.policy);
    if (verdict === 'ignored') {
      this.metrics.onIgnored();
      this.emit('OUTCOME_IGNORED', now);
      if (permit.halfOpenTrial) this.releaseHalfOpen();
      return;
    }

    if (verdict === 'success') {
      this.metrics.onSuccess();
      this.emit('SUCCESS_RECORDED', now);
      if (this.stateMachine.state === 'HALF_OPEN' && permit.halfOpenTrial) {
        this.releaseHalfOpen();
        this.successTracker.record();
        if (this.successTracker.successes >= this.policy.successThreshold)
          this.close(now, 'recovered');
      } else if (this.stateMachine.state === 'CLOSED') {
        this.failureTracker.recordSuccess(now);
      }
      return;
    }

    // failure
    this.metrics.onFailure();
    this.emit('FAILURE_RECORDED', now);
    if (this.stateMachine.state === 'HALF_OPEN' && permit.halfOpenTrial) {
      this.releaseHalfOpen();
      this.open(now, 'trial-failed');
    } else if (this.stateMachine.state === 'CLOSED') {
      this.failureTracker.recordFailure(now);
      if (this.health.shouldOpen(this.failureTracker, this.policy, now))
        this.open(now, 'failure-threshold');
    }
  }

  /** Run an operation through the breaker: short-circuit if open, else record its outcome. */
  async execute<T = unknown>(
    request: HttpRequest,
    operation: () => Promise<HttpResponse<T>>,
  ): Promise<HttpResponse<T>> {
    const permit = this.tryAcquire();
    if (!permit.allowed) throw new HttpCircuitOpenError(request, this.name, permit.state);
    try {
      const response = await operation();
      this.record(permit, { response });
      return response;
    } catch (error) {
      const httpError = isHttpError(error)
        ? error
        : new HttpTransportError('The guarded operation failed.', request, error);
      this.record(permit, { error: httpError });
      throw httpError;
    }
  }

  /* ------------------------------ operator controls ------------------------------ */

  /** Manually reset the circuit to CLOSED and clear all tracking. */
  reset(now: number = this.clock()): void {
    this.transitionTo('CLOSED', 'manual-reset', now);
    this.clearTracking();
    this.emit('RESET', now);
  }
  forceOpen(now: number = this.clock()): void {
    this.transitionTo('FORCED_OPEN', 'forced-open', now);
  }
  forceClosed(now: number = this.clock()): void {
    this.transitionTo('FORCED_CLOSED', 'forced-closed', now);
    this.clearTracking();
  }
  disable(now: number = this.clock()): void {
    this.transitionTo('DISABLED', 'disabled', now);
  }
  enable(now: number = this.clock()): void {
    this.transitionTo('CLOSED', 'enabled', now);
    this.clearTracking();
  }

  /* ------------------------------ observability ------------------------------ */

  snapshot(now: number = this.clock()): CircuitBreakerSnapshot {
    const stats = this.failureTracker.snapshot(now);
    return {
      name: this.name,
      state: this.stateMachine.state,
      ...stats,
      halfOpenInFlight: this.halfOpenInFlight,
      halfOpenSuccesses: this.successTracker.successes,
      openedAt: this.openedAt,
      metrics: this.metrics.snapshot(this.stateMachine.state),
    };
  }
  metricsSnapshot(): CircuitMetricsSnapshot {
    return this.metrics.snapshot(this.stateMachine.state);
  }

  /* ------------------------------ internals ------------------------------ */

  private permitted(state: CircuitState, halfOpenTrial: boolean): CircuitPermit {
    this.metrics.onPermitted();
    this.emit('CALL_PERMITTED', this.clock());
    return { allowed: true, state, halfOpenTrial };
  }
  private rejected(state: CircuitState, reason: string): CircuitPermit {
    this.metrics.onRejected();
    this.emit('CALL_REJECTED', this.clock(), reason);
    return { allowed: false, state, halfOpenTrial: false, reason };
  }
  private open(now: number, reason: string): void {
    if (this.transitionTo('OPEN', reason, now)) {
      this.openedAt = now;
      this.successTracker.reset();
      this.halfOpenInFlight = 0;
      this.metrics.onOpen();
    }
  }
  private close(now: number, reason: string): void {
    if (this.transitionTo('CLOSED', reason, now)) this.clearTracking();
  }
  private toHalfOpen(now: number): void {
    if (this.transitionTo('HALF_OPEN', 'recovery-probe', now)) {
      this.successTracker.reset();
      this.halfOpenInFlight = 0;
    }
  }
  private releaseHalfOpen(): void {
    this.halfOpenInFlight = Math.max(0, this.halfOpenInFlight - 1);
  }
  private clearTracking(): void {
    this.failureTracker.reset();
    this.successTracker.reset();
    this.halfOpenInFlight = 0;
    this.openedAt = undefined;
  }
  private transitionTo(to: CircuitState, reason: string, at: number): boolean {
    const changed = this.stateMachine.transition(to, reason, at);
    if (changed) this.metrics.onTransition();
    return changed;
  }
  private emit(type: import('./events').CircuitEventType, at: number, reason?: string): void {
    this.emitter.emit({ type, circuit: this.name, state: this.stateMachine.state, reason, at });
  }
}
