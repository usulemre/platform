/**
 * `SubscriptionManager` — the Binance stream-name subscription layer over the Common WebSocket Client.
 * It ref-counts consumer handlers per stream and fans a single transport subscription out to all of
 * them, so multiple consumers can share `btcusdt@aggTrade` without duplicate SUBSCRIBE frames. Actual
 * transport, reconnect and automatic resubscription are delegated to the injected `WebSocketClient`
 * (reused, not reimplemented). Combined-stream envelopes (`{ stream, data }`) are unwrapped to the raw
 * `data` before dispatch. Subscribing returns an unsubscribe handle.
 */
import type { WebSocketClient } from '@platform/websocket-client';
import type { BinanceCombinedStreamMessage } from './binance-events';

/** A raw-payload consumer for a stream. */
export type StreamConsumer = (data: unknown) => void;

function unwrap(message: unknown): unknown {
  return typeof message === 'object' && message !== null && 'data' in message
    ? (message as BinanceCombinedStreamMessage).data
    : message;
}

export class SubscriptionManager {
  private readonly consumers = new Map<string, Set<StreamConsumer>>();

  constructor(private readonly client: WebSocketClient) {}

  /** Subscribe a consumer to a stream; returns an unsubscribe handle. */
  subscribe(streamName: string, consumer: StreamConsumer): () => void {
    let set = this.consumers.get(streamName);
    if (!set) {
      set = new Set();
      this.consumers.set(streamName, set);
      this.client.subscribe(streamName, (message) => this.dispatch(streamName, message));
    }
    set.add(consumer);
    return () => this.remove(streamName, consumer);
  }

  private dispatch(streamName: string, message: unknown): void {
    const set = this.consumers.get(streamName);
    if (!set) return;
    const data = unwrap(message);
    for (const consumer of set) consumer(data);
  }

  private remove(streamName: string, consumer: StreamConsumer): void {
    const set = this.consumers.get(streamName);
    if (!set) return;
    set.delete(consumer);
    if (set.size === 0) {
      this.consumers.delete(streamName);
      this.client.unsubscribe(streamName);
    }
  }

  /** Whether a stream currently has at least one consumer. */
  has(streamName: string): boolean {
    return this.consumers.has(streamName);
  }

  /** The active stream names. */
  active(): readonly string[] {
    return [...this.consumers.keys()];
  }

  /** Number of active streams. */
  get size(): number {
    return this.consumers.size;
  }

  /** Remove every consumer and unsubscribe all streams. */
  clear(): void {
    for (const streamName of [...this.consumers.keys()]) {
      this.consumers.delete(streamName);
      this.client.unsubscribe(streamName);
    }
  }
}
