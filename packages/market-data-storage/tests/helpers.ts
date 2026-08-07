/**
 * Shared test helpers: factories for canonical normalized records (the storage layer's input) and a
 * deterministic storage wiring. Records are built directly (storage consumes canonical records from
 * the ingestion pipeline, not raw provider events).
 */
import type {
  CanonicalTimestamps,
  NormalizedAggregateTrade,
  NormalizedBookTicker,
  NormalizedCandlestick,
  NormalizedMarkPrice,
  NormalizedOrderBookDelta,
  NormalizedOrderBookSnapshot,
  NormalizedTicker,
  NormalizedTrade,
} from '@platform/market-data-ingestion';

export const INSTRUMENT = 'BINANCE:BTC-USDT';
export const PROVIDER = 'binance';
export const VENUE_SYMBOL = 'BTCUSDT';
export const T0 = 1_700_000_000_000; // 2023-11-14T…Z
export const DAY = 86_400_000;

let ingest = 0;
function nextIngest(): number {
  return (ingest += 1);
}

function timestamps(eventTime: number): CanonicalTimestamps {
  return {
    eventTime,
    exchangeTime: eventTime,
    receiveTime: eventTime + 1,
    processingTime: eventTime + 2,
  };
}

function provenance(sequence: number | undefined) {
  return {
    providerId: PROVIDER,
    streamKey: `${PROVIDER}:x:${VENUE_SYMBOL}`,
    providerSymbol: VENUE_SYMBOL,
    ...(sequence !== undefined ? { sequence } : {}),
    ingestSequence: nextIngest(),
  };
}

export function trade(overrides: Partial<NormalizedTrade> = {}): NormalizedTrade {
  const eventTime = overrides.timestamps?.eventTime ?? T0;
  const tradeId = overrides.tradeId ?? 1;
  return {
    kind: 'trade',
    instrumentId: INSTRUMENT,
    marketDataType: 'TRADES',
    timestamps: timestamps(eventTime),
    provenance: provenance(tradeId),
    tradeId,
    price: 50_000,
    quantity: 0.5,
    buyerIsMaker: false,
    ...overrides,
  };
}

export function aggTrade(
  overrides: Partial<NormalizedAggregateTrade> = {},
): NormalizedAggregateTrade {
  const id = overrides.aggregateTradeId ?? 1;
  return {
    kind: 'aggTrade',
    instrumentId: INSTRUMENT,
    marketDataType: 'TRADES',
    timestamps: timestamps(T0),
    provenance: provenance(id),
    aggregateTradeId: id,
    price: 50_000,
    quantity: 1.2,
    firstTradeId: 10,
    lastTradeId: 12,
    buyerIsMaker: true,
    ...overrides,
  };
}

export function ticker(overrides: Partial<NormalizedTicker> = {}): NormalizedTicker {
  const eventTime = overrides.timestamps?.eventTime ?? T0;
  return {
    kind: 'ticker',
    instrumentId: INSTRUMENT,
    marketDataType: 'INDEX_PRICES',
    timestamps: timestamps(eventTime),
    provenance: provenance(undefined),
    lastPrice: 50_000,
    openPrice: 49_000,
    highPrice: 51_000,
    lowPrice: 48_500,
    baseVolume: 1234,
    quoteVolume: 61_000_000,
    ...overrides,
  };
}

export function bookTicker(overrides: Partial<NormalizedBookTicker> = {}): NormalizedBookTicker {
  const id = overrides.updateId ?? 1;
  return {
    kind: 'bookTicker',
    instrumentId: INSTRUMENT,
    marketDataType: 'ORDER_BOOKS',
    timestamps: timestamps(T0),
    provenance: provenance(id),
    updateId: id,
    bidPrice: 49_990,
    bidQuantity: 2,
    askPrice: 50_010,
    askQuantity: 3,
    ...overrides,
  };
}

export function candlestick(overrides: Partial<NormalizedCandlestick> = {}): NormalizedCandlestick {
  const openTime = overrides.openTime ?? T0;
  return {
    kind: 'candlestick',
    instrumentId: INSTRUMENT,
    marketDataType: 'OHLCV',
    timestamps: timestamps(openTime),
    provenance: provenance(openTime),
    interval: '1m',
    openTime,
    closeTime: openTime + 59_999,
    open: 49_900,
    high: 50_100,
    low: 49_800,
    close: 50_000,
    baseVolume: 12,
    quoteVolume: 600_000,
    trades: 42,
    closed: true,
    ...overrides,
  };
}

export function markPrice(overrides: Partial<NormalizedMarkPrice> = {}): NormalizedMarkPrice {
  const eventTime = overrides.timestamps?.eventTime ?? T0;
  return {
    kind: 'markPrice',
    instrumentId: INSTRUMENT,
    marketDataType: 'MARK_PRICES',
    timestamps: timestamps(eventTime),
    provenance: provenance(undefined),
    markPrice: 50_005,
    indexPrice: 50_000,
    fundingRate: 0.0001,
    nextFundingTime: T0 + 3_600_000,
    ...overrides,
  };
}

export function orderBookSnapshot(
  overrides: Partial<NormalizedOrderBookSnapshot> = {},
): NormalizedOrderBookSnapshot {
  const lastUpdateId = overrides.lastUpdateId ?? 100;
  return {
    kind: 'orderBookSnapshot',
    instrumentId: INSTRUMENT,
    marketDataType: 'ORDER_BOOKS',
    timestamps: timestamps(T0),
    provenance: provenance(lastUpdateId),
    lastUpdateId,
    bids: [
      { price: 49_990, quantity: 1 },
      { price: 49_980, quantity: 2 },
    ],
    asks: [
      { price: 50_010, quantity: 1 },
      { price: 50_020, quantity: 2 },
    ],
    ...overrides,
  };
}

export function orderBookDelta(
  overrides: Partial<NormalizedOrderBookDelta> = {},
): NormalizedOrderBookDelta {
  const finalUpdateId = overrides.finalUpdateId ?? 101;
  return {
    kind: 'orderBookDelta',
    instrumentId: INSTRUMENT,
    marketDataType: 'ORDER_BOOKS',
    timestamps: timestamps(T0 + 1000),
    provenance: provenance(finalUpdateId),
    firstUpdateId: overrides.firstUpdateId ?? 101,
    finalUpdateId,
    bids: [{ price: 49_990, quantity: 1.5 }],
    asks: [{ price: 50_010, quantity: 0 }],
    ...overrides,
  };
}
