/**
 * `ListenKeyManager` — owns the lifecycle of the single active user-data-stream listen key: creation,
 * keep-alive (which extends validity), expiry tracking and close. Per the documented behaviour a listen
 * key is valid for 60 minutes and is extended by a keep-alive (`PUT`). The clock is INJECTED so
 * validity is deterministic. It performs no WebSocket work — only the REST lifecycle through the
 * injected {@link AuthenticatedRestClient}.
 */
import type { AuthenticatedRestClient } from './rest';

/** Documented listen-key validity: 60 minutes. */
export const LISTEN_KEY_VALIDITY_MS = 60 * 60 * 1000;

export interface ListenKeyManagerDeps {
  readonly rest: AuthenticatedRestClient;
  readonly clock: () => number;
  /** Override the validity window (defaults to the documented 60 minutes). */
  readonly validityMs?: number;
}

export class ListenKeyManager {
  private currentKey?: string;
  private createdAt = 0;
  private lastKeepAliveAt = 0;
  private expiresAt = 0;
  private readonly rest: AuthenticatedRestClient;
  private readonly clock: () => number;
  private readonly validityMs: number;

  constructor(deps: ListenKeyManagerDeps) {
    this.rest = deps.rest;
    this.clock = deps.clock;
    this.validityMs = deps.validityMs ?? LISTEN_KEY_VALIDITY_MS;
  }

  /** The active listen key, or undefined if none is held. */
  get key(): string | undefined {
    return this.currentKey;
  }

  /** Epoch-ms at which the current key expires (0 if none). */
  get expiryAt(): number {
    return this.expiresAt;
  }

  /** Ms until the current key expires (Infinity if none held). */
  timeToExpiryMs(): number {
    return this.currentKey ? this.expiresAt - this.clock() : Number.POSITIVE_INFINITY;
  }

  /** Whether the current key has passed its validity window. */
  isExpired(): boolean {
    return this.currentKey !== undefined && this.clock() >= this.expiresAt;
  }

  /** Create a new listen key (replacing any current one). Returns the key. */
  async create(): Promise<string> {
    const key = await this.rest.createListenKey();
    this.currentKey = key;
    this.createdAt = this.clock();
    this.lastKeepAliveAt = this.createdAt;
    this.expiresAt = this.createdAt + this.validityMs;
    return key;
  }

  /** Keep the current key alive, extending its validity. Throws if no key is held. */
  async keepAlive(): Promise<void> {
    if (!this.currentKey) throw new Error('No active listen key to keep alive.');
    await this.rest.keepAliveListenKey(this.currentKey);
    this.lastKeepAliveAt = this.clock();
    this.expiresAt = this.lastKeepAliveAt + this.validityMs;
  }

  /** Ensure a key exists (create only if absent). Returns the active key. */
  async ensure(): Promise<string> {
    return this.currentKey ?? this.create();
  }

  /** Close and clear the current key (best-effort). */
  async close(): Promise<void> {
    const key = this.currentKey;
    this.clear();
    if (key) await this.rest.closeListenKey(key);
  }

  /** Mark the key expired locally (e.g. on a `listenKeyExpired` event) without a REST call. */
  markExpired(): void {
    this.clear();
  }

  /** The epoch-ms of the last successful keep-alive (0 if none). */
  get lastKeepAlive(): number {
    return this.lastKeepAliveAt;
  }

  private clear(): void {
    this.currentKey = undefined;
    this.createdAt = 0;
    this.lastKeepAliveAt = 0;
    this.expiresAt = 0;
  }
}
