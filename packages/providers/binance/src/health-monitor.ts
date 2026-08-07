/**
 * `BinanceHealthMonitor` — tracks the adapter's live connectivity signals (heartbeat recency, request
 * latency, rolling error rate) and projects them onto the Broker Gateway SDK's deterministic
 * {@link computeBrokerHealth}. It records observations as the REST/WS clients operate and produces a
 * {@link BrokerHealth} on demand. The clock is INJECTED; the health computation itself is the SDK's
 * pure function — this component only accumulates the inputs. No decision is made here beyond feeding
 * the canonical health engine (health-level transitions are applied by the gateway service).
 */
import { computeBrokerHealth, type BrokerHealth, type BrokerStatus } from '@platform/broker-sdk';

export interface BinanceHealthMonitorDeps {
  readonly brokerId: string;
  readonly clock: () => number;
  readonly heartbeatIntervalMs: number;
  /** How many recent request outcomes contribute to the rolling error rate. */
  readonly window?: number;
}

export class BinanceHealthMonitor {
  private readonly brokerId: string;
  private readonly clock: () => number;
  private readonly heartbeatIntervalMs: number;
  private readonly window: number;

  private lastHeartbeatAt: number;
  private latencyMs = 0;
  private readonly outcomes: boolean[] = [];

  constructor(deps: BinanceHealthMonitorDeps) {
    this.brokerId = deps.brokerId;
    this.clock = deps.clock;
    this.heartbeatIntervalMs = deps.heartbeatIntervalMs;
    this.window = deps.window ?? 50;
    this.lastHeartbeatAt = deps.clock();
  }

  /** Record a fresh heartbeat with its measured round-trip latency. */
  recordHeartbeat(latencyMs: number): void {
    this.lastHeartbeatAt = this.clock();
    this.latencyMs = Math.max(0, latencyMs);
    this.pushOutcome(true);
  }

  /** Record a successful request (with optional measured latency). */
  recordSuccess(latencyMs?: number): void {
    if (latencyMs !== undefined) this.latencyMs = Math.max(0, latencyMs);
    this.pushOutcome(true);
  }

  /** Record a failed request. */
  recordError(): void {
    this.pushOutcome(false);
  }

  private pushOutcome(ok: boolean): void {
    this.outcomes.push(ok);
    if (this.outcomes.length > this.window) this.outcomes.shift();
  }

  /** The rolling error rate over the observed window (0 when no observations). */
  get errorRate(): number {
    if (this.outcomes.length === 0) return 0;
    const errors = this.outcomes.reduce((n, ok) => (ok ? n : n + 1), 0);
    return errors / this.outcomes.length;
  }

  /** Compute the canonical broker health for a given lifecycle status. */
  snapshot(status: BrokerStatus): BrokerHealth {
    const at = this.clock();
    return computeBrokerHealth({
      brokerId: this.brokerId,
      status,
      heartbeatAgeMs: Math.max(0, at - this.lastHeartbeatAt),
      latencyMs: this.latencyMs,
      errorRate: this.errorRate,
      heartbeatIntervalMs: this.heartbeatIntervalMs,
      at: new Date(at).toISOString(),
    });
  }
}
