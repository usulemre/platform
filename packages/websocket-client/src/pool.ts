/**
 * `ConnectionPool` (foundation) — a keyed pool of `WebSocketClient`s, so a provider can share one
 * connection per endpoint (or shard) across many subscribers instead of opening a socket per stream.
 * v1 is a lazy get-or-create registry with lifecycle helpers; richer pooling (max size, eviction,
 * load-balancing across shards) is layered on later without changing callers.
 */
import { WebSocketClient, type WebSocketClientConfig } from './client';

export class ConnectionPool {
  private readonly clients = new Map<string, WebSocketClient>();

  /** Get the client for `key`, creating it from `config` on first use. */
  getOrCreate(key: string, config: WebSocketClientConfig): WebSocketClient {
    let client = this.clients.get(key);
    if (!client) {
      client = new WebSocketClient(config);
      this.clients.set(key, client);
    }
    return client;
  }

  get(key: string): WebSocketClient | undefined {
    return this.clients.get(key);
  }
  has(key: string): boolean {
    return this.clients.has(key);
  }
  keys(): readonly string[] {
    return [...this.clients.keys()];
  }
  get size(): number {
    return this.clients.size;
  }

  /** Close and drop the client for `key`. */
  close(key: string): boolean {
    const client = this.clients.get(key);
    if (!client) return false;
    client.close();
    return this.clients.delete(key);
  }

  /** Close every pooled client. */
  closeAll(): void {
    for (const client of this.clients.values()) client.close();
    this.clients.clear();
  }
}
