/**
 * `ConnectionMetrics` — deterministic, in-memory counters for a WebSocket client: connects/disconnects/
 * reconnects, messages sent/received, heartbeats and timeouts, errors by kind, buffered-message peak,
 * and active/total subscriptions. Snapshots are plain data for the Monitoring Module. No IO.
 */
import type { WebSocketErrorKind } from './errors';

export interface ConnectionMetricsSnapshot {
  readonly connects: number;
  readonly disconnects: number;
  readonly reconnects: number;
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly heartbeats: number;
  readonly heartbeatTimeouts: number;
  readonly buffered: number;
  readonly bufferedPeak: number;
  readonly activeSubscriptions: number;
  readonly totalSubscriptions: number;
  readonly errorsByKind: readonly { readonly kind: WebSocketErrorKind; readonly count: number }[];
}

export class ConnectionMetrics {
  private connects = 0;
  private disconnects = 0;
  private reconnects = 0;
  private messagesSent = 0;
  private messagesReceived = 0;
  private heartbeats = 0;
  private heartbeatTimeouts = 0;
  private buffered = 0;
  private bufferedPeak = 0;
  private activeSubscriptions = 0;
  private totalSubscriptions = 0;
  private readonly errorCounts = new Map<WebSocketErrorKind, number>();

  onConnect(): void {
    this.connects += 1;
  }
  onDisconnect(): void {
    this.disconnects += 1;
  }
  onReconnect(): void {
    this.reconnects += 1;
  }
  onSent(): void {
    this.messagesSent += 1;
  }
  onReceived(): void {
    this.messagesReceived += 1;
  }
  onHeartbeat(): void {
    this.heartbeats += 1;
  }
  onHeartbeatTimeout(): void {
    this.heartbeatTimeouts += 1;
  }
  onBuffered(count: number): void {
    this.buffered = count;
    if (count > this.bufferedPeak) this.bufferedPeak = count;
  }
  onError(kind: WebSocketErrorKind): void {
    this.errorCounts.set(kind, (this.errorCounts.get(kind) ?? 0) + 1);
  }
  onSubscribe(): void {
    this.totalSubscriptions += 1;
    this.activeSubscriptions += 1;
  }
  onUnsubscribe(): void {
    if (this.activeSubscriptions > 0) this.activeSubscriptions -= 1;
  }
  setActiveSubscriptions(count: number): void {
    this.activeSubscriptions = count;
  }

  snapshot(): ConnectionMetricsSnapshot {
    return {
      connects: this.connects,
      disconnects: this.disconnects,
      reconnects: this.reconnects,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      heartbeats: this.heartbeats,
      heartbeatTimeouts: this.heartbeatTimeouts,
      buffered: this.buffered,
      bufferedPeak: this.bufferedPeak,
      activeSubscriptions: this.activeSubscriptions,
      totalSubscriptions: this.totalSubscriptions,
      errorsByKind: [...this.errorCounts.entries()]
        .map(([kind, count]) => ({ kind, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
