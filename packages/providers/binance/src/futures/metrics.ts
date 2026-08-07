/**
 * `BinanceFuturesMetrics` — deterministic observability for the USDⓈ-M Futures services. It accumulates
 * counts across the Futures operation families (orders, configuration changes, account/position reads),
 * plus rejects and errors and the last-operation time. Health is delegated to the order module's
 * {@link OrderHealthMonitor} (a rolling success/failure window), reused rather than reimplemented.
 * Timestamps are supplied by the caller (injected clock upstream); metrics are pure accumulators with an
 * immutable snapshot.
 */
import { OrderHealthMonitor } from '../orders/metrics';

export { OrderHealthMonitor as FuturesHealthMonitor };
export type {
  OrderHealth as FuturesHealth,
  OrderHealthLevel as FuturesHealthLevel,
} from '../orders/metrics';

/** The Futures operation families tracked by the metrics accumulator. */
export type FuturesOperationKind = 'order' | 'config' | 'read';

export interface FuturesMetricsSnapshot {
  readonly orders: number;
  readonly configChanges: number;
  readonly reads: number;
  readonly rejects: number;
  readonly errors: number;
  readonly lastOperationAt: number | undefined;
}

export class BinanceFuturesMetrics {
  private orders = 0;
  private configChanges = 0;
  private reads = 0;
  private rejects = 0;
  private errors = 0;
  private lastOperationAt: number | undefined;

  onOperation(kind: FuturesOperationKind, at: number): void {
    if (kind === 'order') this.orders += 1;
    else if (kind === 'config') this.configChanges += 1;
    else this.reads += 1;
    this.lastOperationAt = at;
  }

  onReject(): void {
    this.rejects += 1;
  }
  onError(): void {
    this.errors += 1;
  }

  snapshot(): FuturesMetricsSnapshot {
    return {
      orders: this.orders,
      configChanges: this.configChanges,
      reads: this.reads,
      rejects: this.rejects,
      errors: this.errors,
      lastOperationAt: this.lastOperationAt,
    };
  }
}
