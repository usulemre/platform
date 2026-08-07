/**
 * The **ingestion router** — classifies each canonical event into the processing route it requires,
 * so the pipeline applies the right sequencing/order-book handling without branching on venue
 * specifics. The classification is intrinsic to the *kind* of market data, not the provider:
 *  - order-book snapshot/delta → the order-book synchronizer path (strict contiguity, resync-on-gap);
 *  - trade/aggTrade/bookTicker/candlestick → sequenced (monotonic id, dup/out-of-order/gap checks);
 *  - ticker/mark/avg price → stateless last-write-wins (no sequence).
 * Pure and deterministic.
 */
import type { MarketDataEventKind, RawMarketDataEvent } from '../events/canonical-events';

export interface RouteDecision {
  readonly kind: MarketDataEventKind;
  /** Whether this event carries a monotonic sequence to validate. */
  readonly sequenced: boolean;
  /** Whether the sequence must be strictly contiguous (order-book deltas). */
  readonly contiguous: boolean;
  /** Whether this event is handled by the order-book synchronizer. */
  readonly orderBook: boolean;
}

export class IngestionRouter {
  /** Determine the processing route for an event. */
  route(event: RawMarketDataEvent): RouteDecision {
    switch (event.kind) {
      case 'orderBookSnapshot':
        return { kind: event.kind, sequenced: false, contiguous: false, orderBook: true };
      case 'orderBookDelta':
        return { kind: event.kind, sequenced: true, contiguous: true, orderBook: true };
      case 'trade':
      case 'aggTrade':
      case 'bookTicker':
        return { kind: event.kind, sequenced: true, contiguous: false, orderBook: false };
      // Candlesticks update repeatedly within the same open time (open-bar updates then close),
      // so their `openTime` is NOT a de-duplication key — each update is a valid observation.
      case 'candlestick':
      case 'ticker':
      case 'markPrice':
      case 'avgPrice':
        return { kind: event.kind, sequenced: false, contiguous: false, orderBook: false };
    }
  }
}
