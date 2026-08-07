/**
 * The **data-quality validator** — the semantic gate. Where the schema validator proves an event is
 * well-shaped, this proves its values could describe a real market: prices are positive, quantities
 * non-negative, timestamps are plausible relative to the receive time, and the event is not an
 * *impossible market state* (a crossed book, a candle whose high is below its low, …). Violations are
 * rejected with a precise code (`PRICE_INVALID`, `QUANTITY_INVALID`, `TIMESTAMP_INVALID`,
 * `IMPOSSIBLE_STATE`) so they can be quarantined with a reason. Deterministic and pure — the receive
 * time is passed in.
 */
import type { OrderBookLevel, RawMarketDataEvent } from '../events/canonical-events';
import { accepted, rejected, type Validity } from './validation-result';

/** Tunable data-quality thresholds. */
export interface DataQualityConfig {
  /** How far ahead of the receive time an event timestamp may be before it is rejected (ms). */
  readonly maxClockSkewMs: number;
  /** How far behind the receive time an event timestamp may be before it is rejected (ms). 0 disables. */
  readonly maxStalenessMs: number;
  /** The earliest plausible epoch-ms timestamp (guards against zero/garbage values). */
  readonly minPlausibleTimestamp: number;
}

export const DEFAULT_DATA_QUALITY_CONFIG: DataQualityConfig = {
  maxClockSkewMs: 60_000,
  maxStalenessMs: 0,
  minPlausibleTimestamp: 1_262_304_000_000, // 2010-01-01T00:00:00Z
};

export class DataQualityValidator {
  private readonly config: DataQualityConfig;

  constructor(config: Partial<DataQualityConfig> = {}) {
    this.config = { ...DEFAULT_DATA_QUALITY_CONFIG, ...config };
  }

  /** Validate the quality of a raw event given the time it was received. */
  validate(event: RawMarketDataEvent, receiveTime: number): Validity {
    const ts = this.checkTimestamps(event, receiveTime);
    if (!ts.valid) return ts;

    switch (event.kind) {
      case 'trade':
        return combine(price(event.price), quantity(event.quantity));
      case 'aggTrade':
        return combine(
          price(event.price),
          quantity(event.quantity),
          event.lastTradeId >= event.firstTradeId
            ? accepted
            : rejected('IMPOSSIBLE_STATE', 'aggTrade lastTradeId precedes firstTradeId.'),
        );
      case 'ticker':
        return combine(
          price(event.lastPrice),
          price(event.openPrice),
          price(event.highPrice),
          price(event.lowPrice),
          nonNegative(event.baseVolume, 'baseVolume'),
          nonNegative(event.quoteVolume, 'quoteVolume'),
          event.highPrice >= event.lowPrice
            ? accepted
            : rejected('IMPOSSIBLE_STATE', 'ticker high is below low.'),
        );
      case 'bookTicker':
        return combine(
          price(event.bidPrice),
          price(event.askPrice),
          nonNegative(event.bidQuantity, 'bidQuantity'),
          nonNegative(event.askQuantity, 'askQuantity'),
          event.askPrice >= event.bidPrice
            ? accepted
            : rejected('IMPOSSIBLE_STATE', 'bookTicker bid exceeds ask (crossed).', {
                bid: event.bidPrice,
                ask: event.askPrice,
              }),
        );
      case 'orderBookSnapshot':
        return this.checkBook(event.bids, event.asks);
      case 'orderBookDelta':
        // Deltas may carry zero-quantity levels (deletions); validate prices and non-negativity only.
        return combine(levelsWellFormed(event.bids, 'bids'), levelsWellFormed(event.asks, 'asks'));
      case 'candlestick':
        return this.checkCandle(event);
      case 'markPrice':
        return combine(
          price(event.markPrice),
          event.indexPrice === undefined ? accepted : price(event.indexPrice),
        );
      case 'avgPrice':
        return combine(
          price(event.averagePrice),
          event.intervalMinutes > 0
            ? accepted
            : rejected('IMPOSSIBLE_STATE', 'avgPrice interval must be positive.'),
        );
    }
  }

  private checkTimestamps(event: RawMarketDataEvent, receiveTime: number): Validity {
    const stamps = collectTimestamps(event);
    for (const [field, value] of stamps) {
      if (value < this.config.minPlausibleTimestamp) {
        return rejected('TIMESTAMP_INVALID', `Field '${field}' is not a plausible timestamp.`, {
          field,
          value,
        });
      }
      if (value > receiveTime + this.config.maxClockSkewMs) {
        return rejected('TIMESTAMP_INVALID', `Field '${field}' is too far in the future.`, {
          field,
          value,
          receiveTime,
        });
      }
      if (this.config.maxStalenessMs > 0 && value < receiveTime - this.config.maxStalenessMs) {
        return rejected('TIMESTAMP_INVALID', `Field '${field}' is too stale.`, {
          field,
          value,
          receiveTime,
        });
      }
    }
    return accepted;
  }

  private checkBook(bids: readonly OrderBookLevel[], asks: readonly OrderBookLevel[]): Validity {
    const wellFormed = combine(levelsWellFormed(bids, 'bids'), levelsWellFormed(asks, 'asks'));
    if (!wellFormed.valid) return wellFormed;
    const bestBid = bids.length > 0 ? Math.max(...bids.map((l) => l.price)) : undefined;
    const bestAsk = asks.length > 0 ? Math.min(...asks.map((l) => l.price)) : undefined;
    if (bestBid !== undefined && bestAsk !== undefined && bestBid >= bestAsk) {
      return rejected('IMPOSSIBLE_STATE', 'order-book snapshot is crossed (best bid ≥ best ask).', {
        bestBid,
        bestAsk,
      });
    }
    return accepted;
  }

  private checkCandle(event: Extract<RawMarketDataEvent, { kind: 'candlestick' }>): Validity {
    const base = combine(
      price(event.open),
      price(event.high),
      price(event.low),
      price(event.close),
      nonNegative(event.baseVolume, 'baseVolume'),
      nonNegative(event.quoteVolume, 'quoteVolume'),
      nonNegative(event.trades, 'trades'),
    );
    if (!base.valid) return base;
    if (event.high < event.low) {
      return rejected('IMPOSSIBLE_STATE', 'candlestick high is below low.');
    }
    if (
      event.high < Math.max(event.open, event.close) ||
      event.low > Math.min(event.open, event.close)
    ) {
      return rejected('IMPOSSIBLE_STATE', 'candlestick high/low do not bound open/close.');
    }
    if (event.closeTime < event.openTime) {
      return rejected('IMPOSSIBLE_STATE', 'candlestick closeTime precedes openTime.');
    }
    return accepted;
  }
}

function collectTimestamps(event: RawMarketDataEvent): ReadonlyArray<readonly [string, number]> {
  const out: Array<readonly [string, number]> = [];
  if (event.eventTime !== undefined) out.push(['eventTime', event.eventTime]);
  if (event.exchangeTime !== undefined) out.push(['exchangeTime', event.exchangeTime]);
  if (event.kind === 'trade' || event.kind === 'aggTrade') out.push(['tradeTime', event.tradeTime]);
  if (event.kind === 'avgPrice') out.push(['lastTradeTime', event.lastTradeTime]);
  return out;
}

function price(value: number): Validity {
  return value > 0
    ? accepted
    : rejected('PRICE_INVALID', 'Price must be strictly positive.', { value });
}

function quantity(value: number): Validity {
  return value > 0
    ? accepted
    : rejected('QUANTITY_INVALID', 'Trade quantity must be strictly positive.', { value });
}

function nonNegative(value: number, field: string): Validity {
  return value >= 0
    ? accepted
    : rejected('QUANTITY_INVALID', `Field '${field}' must be non-negative.`, { field, value });
}

function levelsWellFormed(levels: readonly OrderBookLevel[], side: string): Validity {
  for (const level of levels) {
    if (level.price <= 0) {
      return rejected('PRICE_INVALID', `Order-book '${side}' level price must be positive.`, {
        side,
      });
    }
    if (level.quantity < 0) {
      return rejected('QUANTITY_INVALID', `Order-book '${side}' level quantity is negative.`, {
        side,
      });
    }
  }
  return accepted;
}

function combine(...results: readonly Validity[]): Validity {
  for (const result of results) {
    if (!result.valid) return result;
  }
  return accepted;
}
