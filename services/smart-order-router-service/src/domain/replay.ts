/**
 * Routing replay — deterministic event-sourced reconstruction of a routing's status timeline from its
 * recorded lifecycle events, validated against the state machine. Powers the Routing Replay view and
 * proves the event log is consistent with the current status. No IO.
 */
import {
  canTransition,
  type Routing,
  type RoutingState,
  type RoutingStatus,
} from '@platform/sor-sdk';

export interface ReplayStep {
  readonly index: number;
  readonly type: string;
  readonly from: RoutingStatus;
  readonly to: RoutingStatus;
  readonly legalTransition: boolean;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
}

export interface ReplayResult {
  readonly routingId: string;
  readonly steps: readonly ReplayStep[];
  readonly reconstructedStatus: RoutingStatus;
  readonly recordedStatus: RoutingStatus;
  readonly consistent: boolean;
  readonly states: readonly RoutingState[];
}

export function replayRouting(routing: Routing): ReplayResult {
  let current: RoutingStatus = 'EXECUTION_REQUEST';
  let legalThroughout = true;
  const steps: ReplayStep[] = [];
  const states: RoutingState[] = [];
  let index = 0;

  for (const event of routing.events) {
    if (event.status === undefined) continue;
    const to = event.status;
    if (index === 0) {
      current = to;
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
    } else {
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
      current = to;
    }
    states.push({ status: to, at: event.at, note: event.message });
    index += 1;
  }

  return {
    routingId: routing.id,
    steps,
    reconstructedStatus: current,
    recordedStatus: routing.status,
    consistent: legalThroughout && current === routing.status,
    states,
  };
}
