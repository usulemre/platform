/**
 * The **timestamp normalizer** — builds the canonical four-axis timestamp model without ever
 * discarding what the venue reported. It preserves the event time and exchange (transaction) time as
 * given, and *adds* the pipeline's receive time and processing time. Exchange timestamps are never
 * silently overwritten (platform rule); when a venue reports only one time, only that axis is filled.
 */
import type { RawMarketDataEvent } from '../events/canonical-events';
import type { CanonicalTimestamps } from '../events/envelope';

export class TimestampNormalizer {
  /**
   * Assemble the canonical timestamps. `receiveTime` is when the gateway received the event and
   * `processingTime` is stamped as normalization completes; both come from the injected clock.
   */
  normalize(
    event: RawMarketDataEvent,
    receiveTime: number,
    processingTime: number,
  ): CanonicalTimestamps {
    const exchangeTime = event.exchangeTime ?? deriveExchangeTime(event);
    const base: { eventTime?: number; exchangeTime?: number } = {};
    if (event.eventTime !== undefined) base.eventTime = event.eventTime;
    if (exchangeTime !== undefined) base.exchangeTime = exchangeTime;
    return { ...base, receiveTime, processingTime };
  }
}

/** Derive an exchange/transaction time from event-specific fields when not explicitly provided. */
function deriveExchangeTime(event: RawMarketDataEvent): number | undefined {
  switch (event.kind) {
    case 'trade':
    case 'aggTrade':
      return event.tradeTime;
    case 'candlestick':
      return event.closeTime;
    case 'avgPrice':
      return event.lastTradeTime;
    default:
      return undefined;
  }
}
