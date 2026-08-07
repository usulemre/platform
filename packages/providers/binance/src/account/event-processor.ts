/**
 * `EventProcessor` — the single gate that applies incremental account events to the maintained state,
 * protecting against duplicate and out-of-order (stale) events via the {@link SequenceValidator}. It
 * keys each event stably (per asset / per symbol+side / per account update-time) so concurrent,
 * different events at the same event-time are all accepted while true duplicates are dropped. Accepted
 * events are routed to the balance/position synchronizers; rejected events are reported (never silently
 * applied). Deterministic; no IO.
 */
import { SequenceValidator, type SequenceDecision } from './sequence-validator';
import type { BinanceBalanceSynchronizer } from './balance-synchronizer';
import type { BinancePositionSynchronizer } from './position-synchronizer';
import type { AccountUpdatedEvent, BalanceUpdatedEvent, PositionUpdatedEvent } from './canonical';

/** The incremental account events the processor consumes. */
export type IncrementalAccountEvent =
  | AccountUpdatedEvent
  | BalanceUpdatedEvent
  | PositionUpdatedEvent;

export interface ProcessResult {
  readonly decision: SequenceDecision;
  readonly applied: boolean;
}

export interface EventProcessorDeps {
  readonly sequence: SequenceValidator;
  readonly balances: BinanceBalanceSynchronizer;
  readonly positions: BinancePositionSynchronizer;
  readonly onOutcome?: (event: IncrementalAccountEvent, decision: SequenceDecision) => void;
}

function identify(event: IncrementalAccountEvent): { eventTime: number; key: string } {
  switch (event.kind) {
    case 'accountUpdated':
      return {
        eventTime: event.eventTime,
        key: `account:${event.lastUpdateTime ?? event.eventTime}`,
      };
    case 'balanceUpdated':
      return { eventTime: event.eventTime, key: `balance:${event.asset}` };
    case 'positionUpdated':
      return {
        eventTime: event.eventTime,
        key: `position:${event.venueSymbol}:${event.positionSide}`,
      };
  }
}

export class EventProcessor {
  private readonly deps: EventProcessorDeps;

  constructor(deps: EventProcessorDeps) {
    this.deps = deps;
  }

  /** Classify and (if in-order and unseen) apply an incremental event. */
  process(event: IncrementalAccountEvent): ProcessResult {
    const { eventTime, key } = identify(event);
    const decision = this.deps.sequence.check({ eventTime, key });
    if (decision !== 'ok') {
      this.deps.onOutcome?.(event, decision);
      return { decision, applied: false };
    }
    this.apply(event);
    this.deps.onOutcome?.(event, decision);
    return { decision, applied: true };
  }

  private apply(event: IncrementalAccountEvent): void {
    switch (event.kind) {
      case 'accountUpdated':
        this.deps.balances.applyAccountBalances(event.balances);
        this.deps.positions.applyPositions(event.positions);
        break;
      case 'balanceUpdated':
        this.deps.balances.applyDelta(event.asset, event.delta);
        break;
      case 'positionUpdated':
        this.deps.positions.upsert(event);
        break;
    }
  }
}
