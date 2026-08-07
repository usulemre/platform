/**
 * Shared test helpers: a deterministic gateway wiring, a registry seeded with a canonical instrument,
 * and factory functions for canonical events. Keeps the test bodies focused on behaviour.
 */
import {
  InMemoryInstrumentRegistry,
  InMemoryMarketDataStore,
  ManualClock,
  MarketDataIngestionGateway,
  type MarketDataIngestionGatewayOptions,
  type RawAggregateTradeEvent,
  type RawAveragePriceEvent,
  type RawBookTickerEvent,
  type RawCandlestickEvent,
  type RawMarkPriceEvent,
  type RawOrderBookDeltaEvent,
  type RawOrderBookSnapshotEvent,
  type RawTickerEvent,
  type RawTradeEvent,
} from '../src/index';

export const PROVIDER = 'binance';
export const VENUE_SYMBOL = 'BTCUSDT';
export const INSTRUMENT_ID = 'BINANCE:BTC-USDT';
export const T0 = 1_700_000_000_000;

export function makeRegistry(): InMemoryInstrumentRegistry {
  return new InMemoryInstrumentRegistry().register(PROVIDER, VENUE_SYMBOL, {
    instrumentId: INSTRUMENT_ID,
    base: 'BTC',
    quote: 'USDT',
    assetClass: 'CRYPTO',
    active: true,
  });
}

export interface Harness {
  readonly gateway: MarketDataIngestionGateway;
  readonly store: InMemoryMarketDataStore;
  readonly clock: ManualClock;
  readonly registry: InMemoryInstrumentRegistry;
}

export function makeHarness(overrides: Partial<MarketDataIngestionGatewayOptions> = {}): Harness {
  const clock = new ManualClock(T0);
  const store = new InMemoryMarketDataStore();
  const registry = makeRegistry();
  const gateway = new MarketDataIngestionGateway({
    store,
    registry,
    clock,
    ...overrides,
  });
  return { gateway, store, clock, registry };
}

export function trade(overrides: Partial<RawTradeEvent> = {}): RawTradeEvent {
  return {
    kind: 'trade',
    providerSymbol: VENUE_SYMBOL,
    tradeId: 1,
    price: 50_000,
    quantity: 0.5,
    buyerIsMaker: false,
    tradeTime: T0,
    eventTime: T0,
    ...overrides,
  };
}

export function aggTrade(overrides: Partial<RawAggregateTradeEvent> = {}): RawAggregateTradeEvent {
  return {
    kind: 'aggTrade',
    providerSymbol: VENUE_SYMBOL,
    aggregateTradeId: 1,
    price: 50_000,
    quantity: 1.2,
    firstTradeId: 10,
    lastTradeId: 12,
    buyerIsMaker: true,
    tradeTime: T0,
    eventTime: T0,
    ...overrides,
  };
}

export function ticker(overrides: Partial<RawTickerEvent> = {}): RawTickerEvent {
  return {
    kind: 'ticker',
    providerSymbol: VENUE_SYMBOL,
    lastPrice: 50_000,
    openPrice: 49_000,
    highPrice: 51_000,
    lowPrice: 48_500,
    baseVolume: 1234,
    quoteVolume: 61_000_000,
    eventTime: T0,
    ...overrides,
  };
}

export function bookTicker(overrides: Partial<RawBookTickerEvent> = {}): RawBookTickerEvent {
  return {
    kind: 'bookTicker',
    providerSymbol: VENUE_SYMBOL,
    updateId: 1,
    bidPrice: 49_990,
    bidQuantity: 2,
    askPrice: 50_010,
    askQuantity: 3,
    eventTime: T0,
    ...overrides,
  };
}

export function candlestick(overrides: Partial<RawCandlestickEvent> = {}): RawCandlestickEvent {
  return {
    kind: 'candlestick',
    providerSymbol: VENUE_SYMBOL,
    interval: '1m',
    openTime: T0,
    closeTime: T0 + 59_999,
    open: 49_900,
    high: 50_100,
    low: 49_800,
    close: 50_000,
    baseVolume: 12,
    quoteVolume: 600_000,
    trades: 42,
    closed: true,
    eventTime: T0,
    ...overrides,
  };
}

export function markPrice(overrides: Partial<RawMarkPriceEvent> = {}): RawMarkPriceEvent {
  return {
    kind: 'markPrice',
    providerSymbol: VENUE_SYMBOL,
    markPrice: 50_005,
    indexPrice: 50_000,
    fundingRate: 0.0001,
    nextFundingTime: T0 + 3_600_000,
    eventTime: T0,
    ...overrides,
  };
}

export function averagePrice(overrides: Partial<RawAveragePriceEvent> = {}): RawAveragePriceEvent {
  return {
    kind: 'avgPrice',
    providerSymbol: VENUE_SYMBOL,
    intervalMinutes: 5,
    averagePrice: 50_000,
    lastTradeTime: T0,
    eventTime: T0,
    ...overrides,
  };
}

export function orderBookSnapshot(
  overrides: Partial<RawOrderBookSnapshotEvent> = {},
): RawOrderBookSnapshotEvent {
  return {
    kind: 'orderBookSnapshot',
    providerSymbol: VENUE_SYMBOL,
    lastUpdateId: 100,
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
  overrides: Partial<RawOrderBookDeltaEvent> = {},
): RawOrderBookDeltaEvent {
  return {
    kind: 'orderBookDelta',
    providerSymbol: VENUE_SYMBOL,
    firstUpdateId: 101,
    finalUpdateId: 101,
    bids: [{ price: 49_990, quantity: 1.5 }],
    asks: [{ price: 50_010, quantity: 0 }],
    eventTime: T0,
    ...overrides,
  };
}
