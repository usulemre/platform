/**
 * `OrderMetrics` and `OrderHealthMonitor` — deterministic observability for the order service. Metrics
 * accumulate operation counts (creates, cancels, cancel-alls, replaces, queries), rejects and errors,
 * plus the last operation time. The health monitor projects a rolling success/failure window onto a
 * health level. Timestamps are supplied by the caller (injected clock upstream); metrics are pure
 * accumulators with an immutable snapshot.
 */
export interface OrderMetricsSnapshot {
  readonly creates: number;
  readonly cancels: number;
  readonly cancelAlls: number;
  readonly replaces: number;
  readonly queries: number;
  readonly rejects: number;
  readonly errors: number;
  readonly lastOperationAt: number | undefined;
}

export type OrderOperationKind = 'create' | 'cancel' | 'cancelAll' | 'replace' | 'query';

export class OrderMetrics {
  private creates = 0;
  private cancels = 0;
  private cancelAlls = 0;
  private replaces = 0;
  private queries = 0;
  private rejects = 0;
  private errors = 0;
  private lastOperationAt: number | undefined;

  onOperation(kind: OrderOperationKind, at: number): void {
    switch (kind) {
      case 'create':
        this.creates += 1;
        break;
      case 'cancel':
        this.cancels += 1;
        break;
      case 'cancelAll':
        this.cancelAlls += 1;
        break;
      case 'replace':
        this.replaces += 1;
        break;
      case 'query':
        this.queries += 1;
        break;
    }
    this.lastOperationAt = at;
  }

  onReject(): void {
    this.rejects += 1;
  }
  onError(): void {
    this.errors += 1;
  }

  snapshot(): OrderMetricsSnapshot {
    return {
      creates: this.creates,
      cancels: this.cancels,
      cancelAlls: this.cancelAlls,
      replaces: this.replaces,
      queries: this.queries,
      rejects: this.rejects,
      errors: this.errors,
      lastOperationAt: this.lastOperationAt,
    };
  }
}

export type OrderHealthLevel = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'IDLE';

export interface OrderHealth {
  readonly level: OrderHealthLevel;
  readonly errorRate: number;
  readonly sampled: number;
  readonly lastOperationAgeMs: number;
  readonly evaluatedAt: number;
}

export interface OrderHealthMonitorDeps {
  readonly clock: () => number;
  readonly window?: number;
}

export class OrderHealthMonitor {
  private readonly outcomes: boolean[] = [];
  private lastOperationAt: number | undefined;
  private readonly clock: () => number;
  private readonly window: number;

  constructor(deps: OrderHealthMonitorDeps) {
    this.clock = deps.clock;
    this.window = deps.window ?? 50;
  }

  record(ok: boolean): void {
    this.lastOperationAt = this.clock();
    this.outcomes.push(ok);
    if (this.outcomes.length > this.window) this.outcomes.shift();
  }

  get errorRate(): number {
    if (this.outcomes.length === 0) return 0;
    return this.outcomes.reduce((n, ok) => (ok ? n : n + 1), 0) / this.outcomes.length;
  }

  evaluate(): OrderHealth {
    const at = this.clock();
    const rate = this.errorRate;
    let level: OrderHealthLevel;
    if (this.outcomes.length === 0) level = 'IDLE';
    else if (rate >= 0.5) level = 'UNHEALTHY';
    else if (rate > 0.1) level = 'DEGRADED';
    else level = 'HEALTHY';
    return {
      level,
      errorRate: rate,
      sampled: this.outcomes.length,
      lastOperationAgeMs: this.lastOperationAt === undefined ? -1 : at - this.lastOperationAt,
      evaluatedAt: at,
    };
  }
}
