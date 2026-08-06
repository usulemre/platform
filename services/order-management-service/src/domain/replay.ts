/**
 * Order replay — deterministic event-sourced reconstruction of an order's status timeline from its
 * recorded lifecycle events, validated against the state machine. Powers the Order Replay view and
 * proves the event log is consistent with the current order status. No IO.
 */
import {
  canTransition,
  type Order,
  type OrderEvent,
  type OrderState,
  type OrderStatus,
} from '@platform/order-sdk';

export interface ReplayStep {
  readonly index: number;
  readonly type: string;
  readonly from: OrderStatus;
  readonly to: OrderStatus;
  readonly legalTransition: boolean;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
}

export interface ReplayResult {
  readonly orderId: string;
  readonly steps: readonly ReplayStep[];
  readonly reconstructedStatus: OrderStatus;
  readonly recordedStatus: OrderStatus;
  /** Whether the reconstruction matches the recorded status and every transition was legal. */
  readonly consistent: boolean;
  readonly states: readonly OrderState[];
}

/** Reconstruct an order's status timeline by folding its status-bearing events. */
export function replayOrder(order: Order): ReplayResult {
  let current: OrderStatus = 'CREATED';
  let legalThroughout = true;
  const steps: ReplayStep[] = [];
  const states: OrderState[] = [];
  let index = 0;

  const statusEvents: OrderEvent[] = order.events.filter(
    (event): event is OrderEvent & { status: OrderStatus } => event.status !== undefined,
  );

  for (const event of statusEvents) {
    const to = event.status!;
    if (index === 0) {
      // The first status event establishes the initial (CREATED) status.
      current = to;
      states.push({ status: to, at: event.at, note: event.message });
      steps.push({
        index,
        type: event.type,
        from: to,
        to,
        legalTransition: true,
        actor: event.actor,
        at: event.at,
        message: event.message,
      });
      index += 1;
      continue;
    }
    const legal = canTransition(current, to) || current === to;
    if (!legal) legalThroughout = false;
    steps.push({
      index,
      type: event.type,
      from: current,
      to,
      legalTransition: legal,
      actor: event.actor,
      at: event.at,
      message: event.message,
    });
    states.push({ status: to, at: event.at, note: event.message });
    current = to;
    index += 1;
  }

  return {
    orderId: order.id,
    steps,
    reconstructedStatus: current,
    recordedStatus: order.status,
    consistent: legalThroughout && current === order.status,
    states,
  };
}
