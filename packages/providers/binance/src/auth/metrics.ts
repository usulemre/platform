/**
 * `UserDataMetrics` and `UserDataHealthMonitor` — deterministic observability for the authenticated
 * user data stream. Metrics accumulate event counts (by canonical kind), keep-alives, key recreations,
 * listen-key expiries, reconnects and the last event time. The health monitor projects the connection
 * state, message recency and authentication state onto a health level. Both take timestamps from an
 * injected clock; metrics are pure accumulators with an immutable snapshot.
 */
import type { AuthenticationState } from './events';

export interface UserDataMetricsSnapshot {
  readonly totalEvents: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly keepAlives: number;
  readonly keyRecreations: number;
  readonly listenKeyExpiries: number;
  readonly reconnects: number;
  readonly errors: number;
  readonly lastEventAt: number | undefined;
}

export class UserDataMetrics {
  private total = 0;
  private readonly perKind = new Map<string, number>();
  private keepAlives = 0;
  private keyRecreations = 0;
  private listenKeyExpiries = 0;
  private reconnects = 0;
  private errors = 0;
  private lastEventAt: number | undefined;

  onEvent(kind: string, at: number): void {
    this.total += 1;
    this.perKind.set(kind, (this.perKind.get(kind) ?? 0) + 1);
    this.lastEventAt = at;
  }
  onKeepAlive(): void {
    this.keepAlives += 1;
  }
  onKeyRecreation(): void {
    this.keyRecreations += 1;
  }
  onListenKeyExpiry(): void {
    this.listenKeyExpiries += 1;
  }
  onReconnect(): void {
    this.reconnects += 1;
  }
  onError(): void {
    this.errors += 1;
  }

  snapshot(): UserDataMetricsSnapshot {
    return {
      totalEvents: this.total,
      byKind: Object.fromEntries(this.perKind),
      keepAlives: this.keepAlives,
      keyRecreations: this.keyRecreations,
      listenKeyExpiries: this.listenKeyExpiries,
      reconnects: this.reconnects,
      errors: this.errors,
      lastEventAt: this.lastEventAt,
    };
  }
}

export type UserDataHealthLevel =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'STALE'
  | 'DISCONNECTED'
  | 'UNAUTHENTICATED';

export interface UserDataHealth {
  readonly level: UserDataHealthLevel;
  readonly authState: AuthenticationState;
  readonly connected: boolean;
  readonly lastEventAgeMs: number;
  readonly listenKeyExpiries: number;
  readonly evaluatedAt: number;
}

export interface UserDataHealthMonitorDeps {
  readonly clock: () => number;
  /** Age (ms) beyond which an authenticated, connected stream with no events is STALE. */
  readonly stalenessMs: number;
}

export class UserDataHealthMonitor {
  private lastEventAt: number | undefined;
  private priorExpiries = 0;
  private readonly clock: () => number;
  private readonly stalenessMs: number;

  constructor(deps: UserDataHealthMonitorDeps) {
    this.clock = deps.clock;
    this.stalenessMs = deps.stalenessMs;
  }

  recordEvent(): void {
    this.lastEventAt = this.clock();
  }

  lastEventAgeMs(): number {
    return this.lastEventAt === undefined
      ? Number.POSITIVE_INFINITY
      : this.clock() - this.lastEventAt;
  }

  evaluate(
    authState: AuthenticationState,
    connected: boolean,
    listenKeyExpiries: number,
  ): UserDataHealth {
    const at = this.clock();
    const ageMs = this.lastEventAgeMs();
    let level: UserDataHealthLevel;
    if (authState !== 'AUTHENTICATED') level = 'UNAUTHENTICATED';
    else if (!connected) level = 'DISCONNECTED';
    else if (listenKeyExpiries > this.priorExpiries) level = 'DEGRADED';
    else if (this.lastEventAt !== undefined && ageMs > this.stalenessMs) level = 'STALE';
    else level = 'HEALTHY';
    this.priorExpiries = listenKeyExpiries;
    return {
      level,
      authState,
      connected,
      lastEventAgeMs: ageMs === Number.POSITIVE_INFINITY ? -1 : ageMs,
      listenKeyExpiries,
      evaluatedAt: at,
    };
  }
}
