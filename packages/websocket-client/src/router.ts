/**
 * `MessageRouter` — routes a decoded inbound message to the right destination: a control handler
 * (e.g. pong), a pending correlated request, or a topic subscription; anything unmatched is reported
 * as an unknown message. The extraction of control/correlation/topic keys is INJECTED, so the router
 * stays provider-independent (no protocol assumptions baked in).
 */
import type { Correlator } from './correlation';
import type { SubscriptionManager } from './subscription';

export interface MessageRouterDeps {
  readonly subscriptions: SubscriptionManager;
  readonly correlator: Correlator;
  /** Whether a message is a control frame (e.g. pong); handled by `onControl`. */
  readonly isControl?: (message: unknown) => boolean;
  readonly onControl?: (message: unknown) => void;
  /** Extract a correlation id from a response message, if any. */
  readonly resolveCorrelationId?: (message: unknown) => string | undefined;
  /** Extract the subscription topic from a message, if any. */
  readonly resolveTopic?: (message: unknown) => string | undefined;
  /** Called when nothing matched. */
  readonly onUnknown: (message: unknown) => void;
}

export class MessageRouter {
  constructor(private readonly deps: MessageRouterDeps) {}

  route(message: unknown): void {
    if (this.deps.isControl?.(message)) {
      this.deps.onControl?.(message);
      return;
    }
    const correlationId = this.deps.resolveCorrelationId?.(message);
    if (correlationId !== undefined && this.deps.correlator.resolve(correlationId, message)) return;

    const topic = this.deps.resolveTopic?.(message);
    if (topic !== undefined && this.deps.subscriptions.dispatch(topic, message)) return;

    this.deps.onUnknown(message);
  }
}
