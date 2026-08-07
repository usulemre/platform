/**
 * `Subscription` and `SubscriptionManager` — the subscription lifecycle. Each topic has one
 * subscription with a typed handler; the manager tracks active/inactive state so the client can
 * transparently re-subscribe every topic after a reconnect. Supports many concurrent subscriptions.
 */
export type MessageHandler<T = unknown> = (message: T) => void;

export interface Subscription<T = unknown> {
  readonly topic: string;
  readonly handler: MessageHandler<T>;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
  active: boolean;
}

export class SubscriptionManager {
  private readonly subscriptions = new Map<string, Subscription>();

  add<T>(
    topic: string,
    handler: MessageHandler<T>,
    now: number,
    params?: Readonly<Record<string, unknown>>,
  ): Subscription<T> {
    const subscription: Subscription<T> = { topic, handler, params, createdAt: now, active: false };
    this.subscriptions.set(topic, subscription as Subscription);
    return subscription;
  }
  remove(topic: string): boolean {
    return this.subscriptions.delete(topic);
  }
  get(topic: string): Subscription | undefined {
    return this.subscriptions.get(topic);
  }
  has(topic: string): boolean {
    return this.subscriptions.has(topic);
  }
  topics(): readonly string[] {
    return [...this.subscriptions.keys()];
  }
  all(): readonly Subscription[] {
    return [...this.subscriptions.values()];
  }
  activeTopics(): readonly string[] {
    return this.all()
      .filter((s) => s.active)
      .map((s) => s.topic);
  }
  get size(): number {
    return this.subscriptions.size;
  }
  get activeCount(): number {
    return this.all().filter((s) => s.active).length;
  }

  setActive(topic: string, active: boolean): void {
    const subscription = this.subscriptions.get(topic);
    if (subscription) subscription.active = active;
  }
  markAll(active: boolean): void {
    for (const subscription of this.subscriptions.values()) subscription.active = active;
  }

  /** Dispatch a message to a topic's handler; returns whether a subscription handled it. */
  dispatch(topic: string, message: unknown): boolean {
    const subscription = this.subscriptions.get(topic);
    if (!subscription) return false;
    subscription.handler(message);
    return true;
  }
}
