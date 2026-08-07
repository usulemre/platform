/**
 * `EventMapper` — translates validated raw Binance stream payloads into the canonical, immutable
 * market-data events. It is the ONLY component that reads Binance field names for streams; downstream
 * consumers see canonical events exclusively. Symbol names are canonicalized through an injected
 * {@link SymbolResolver} (backed by the Exchange Metadata Registry when available, else identity), so
 * the mapper needs no venue lookups of its own. Pure and deterministic; numeric strings are parsed to
 * numbers, timestamps preserved as epoch-ms.
 */
import { num } from '../mappers/parse';
import { ROLLING_WINDOW_MS, type RollingWindow } from './channels';
import type { BinanceMarket } from '../constants';
import type {
  BinanceRawAggTrade,
  BinanceRawAvgPrice,
  BinanceRawBookTicker,
  BinanceRawDepthUpdate,
  BinanceRawKline,
  BinanceRawMarkPrice,
  BinanceRawMiniTicker,
  BinanceRawPartialDepth,
  BinanceRawRollingTicker,
  BinanceRawTicker,
  BinanceRawTrade,
} from './binance-events';
import type {
  AggregateTradeEvent,
  AveragePriceEvent,
  BookTickerEvent,
  CandlestickEvent,
  MarkPriceEvent,
  MarketTradeEvent,
  OrderBookDelta,
  OrderBookLevel,
  OrderBookSnapshot,
  TickerEvent,
} from './events';

/** Resolves a venue symbol (e.g. `BTCUSDT`) to a canonical name (e.g. `BTC-USDT`). */
export interface SymbolResolver {
  toCanonical(venueSymbol: string): string;
}

/** The identity resolver — upper-cases the venue symbol when no metadata is available. */
export const IDENTITY_SYMBOL_RESOLVER: SymbolResolver = {
  toCanonical: (venueSymbol) => venueSymbol.toUpperCase(),
};

function levels(rows: readonly [string, string][]): readonly OrderBookLevel[] {
  return rows.map(([price, quantity]) => ({ price: num(price), quantity: num(quantity) }));
}

/** Parse a rolling window from a rolling-ticker `e` field (`1hTicker` → `1h`). */
function rollingWindowFromEvent(event: string): RollingWindow | undefined {
  const window = event.replace(/Ticker$/, '');
  return window in ROLLING_WINDOW_MS ? (window as RollingWindow) : undefined;
}

/** Parse an average-price interval (`5m` → 5). */
function intervalMinutes(interval: string): number {
  const match = /^(\d+)m$/.exec(interval);
  return match ? Number(match[1]) : 0;
}

export class EventMapper {
  constructor(
    private readonly resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER,
    private readonly market: BinanceMarket = 'SPOT',
  ) {}

  private symbol(venueSymbol: string): string {
    return this.resolver.toCanonical(venueSymbol);
  }

  trade(raw: BinanceRawTrade): MarketTradeEvent {
    return {
      kind: 'trade',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      tradeId: raw.t,
      price: num(raw.p),
      quantity: num(raw.q),
      buyerIsMaker: raw.m,
      tradeTime: raw.T,
      eventTime: raw.E,
    };
  }

  aggTrade(raw: BinanceRawAggTrade): AggregateTradeEvent {
    return {
      kind: 'aggTrade',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      aggregateTradeId: raw.a,
      price: num(raw.p),
      quantity: num(raw.q),
      firstTradeId: raw.f,
      lastTradeId: raw.l,
      buyerIsMaker: raw.m,
      tradeTime: raw.T,
      eventTime: raw.E,
    };
  }

  miniTicker(raw: BinanceRawMiniTicker): TickerEvent {
    return {
      kind: 'ticker',
      tickerKind: 'MINI',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      lastPrice: num(raw.c),
      openPrice: num(raw.o),
      highPrice: num(raw.h),
      lowPrice: num(raw.l),
      baseVolume: num(raw.v),
      quoteVolume: num(raw.q),
      eventTime: raw.E,
    };
  }

  ticker(raw: BinanceRawTicker): TickerEvent {
    return {
      kind: 'ticker',
      tickerKind: 'FULL',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      lastPrice: num(raw.c),
      openPrice: num(raw.o),
      highPrice: num(raw.h),
      lowPrice: num(raw.l),
      baseVolume: num(raw.v),
      quoteVolume: num(raw.q),
      weightedAvgPrice: num(raw.w),
      priceChange: num(raw.p),
      priceChangePercent: num(raw.P),
      bidPrice: num(raw.b),
      bidQuantity: num(raw.B),
      askPrice: num(raw.a),
      askQuantity: num(raw.A),
      tradeCount: raw.n,
      eventTime: raw.E,
    };
  }

  rollingTicker(raw: BinanceRawRollingTicker): TickerEvent {
    const window = rollingWindowFromEvent(raw.e);
    return {
      kind: 'ticker',
      tickerKind: 'ROLLING',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      windowMs: window ? ROLLING_WINDOW_MS[window] : undefined,
      lastPrice: num(raw.c),
      openPrice: num(raw.o),
      highPrice: num(raw.h),
      lowPrice: num(raw.l),
      baseVolume: num(raw.v),
      quoteVolume: num(raw.q),
      weightedAvgPrice: num(raw.w),
      priceChange: num(raw.p),
      priceChangePercent: num(raw.P),
      tradeCount: raw.n,
      eventTime: raw.E,
    };
  }

  bookTicker(raw: BinanceRawBookTicker): BookTickerEvent {
    return {
      kind: 'bookTicker',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      updateId: raw.u,
      bidPrice: num(raw.b),
      bidQuantity: num(raw.B),
      askPrice: num(raw.a),
      askQuantity: num(raw.A),
      eventTime: raw.E,
      transactionTime: raw.T,
    };
  }

  partialDepth(venueSymbol: string, raw: BinanceRawPartialDepth): OrderBookSnapshot {
    return {
      kind: 'orderBookSnapshot',
      symbol: this.symbol(venueSymbol),
      venueSymbol,
      lastUpdateId: raw.lastUpdateId ?? raw.u ?? 0,
      bids: levels(raw.bids),
      asks: levels(raw.asks),
      eventTime: raw.E,
    };
  }

  depthUpdate(raw: BinanceRawDepthUpdate): OrderBookDelta {
    return {
      kind: 'orderBookDelta',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      firstUpdateId: raw.U,
      finalUpdateId: raw.u,
      previousFinalUpdateId: this.market === 'FUTURES' ? raw.pu : undefined,
      bids: levels(raw.b),
      asks: levels(raw.a),
      eventTime: raw.E,
      transactionTime: raw.T,
    };
  }

  kline(raw: BinanceRawKline): CandlestickEvent {
    const k = raw.k;
    return {
      kind: 'kline',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      interval: k.i,
      openTime: k.t,
      closeTime: k.T,
      open: num(k.o),
      high: num(k.h),
      low: num(k.l),
      close: num(k.c),
      baseVolume: num(k.v),
      quoteVolume: num(k.q),
      trades: k.n,
      firstTradeId: k.f,
      lastTradeId: k.L,
      takerBuyBaseVolume: num(k.V),
      takerBuyQuoteVolume: num(k.Q),
      closed: k.x,
      eventTime: raw.E,
    };
  }

  avgPrice(raw: BinanceRawAvgPrice): AveragePriceEvent {
    return {
      kind: 'avgPrice',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      intervalMinutes: intervalMinutes(raw.i),
      averagePrice: num(raw.w),
      lastTradeTime: raw.T,
      eventTime: raw.E,
    };
  }

  markPrice(raw: BinanceRawMarkPrice): MarkPriceEvent {
    return {
      kind: 'markPrice',
      symbol: this.symbol(raw.s),
      venueSymbol: raw.s,
      markPrice: num(raw.p),
      indexPrice: num(raw.i),
      estimatedSettlePrice: num(raw.P),
      fundingRate: num(raw.r),
      nextFundingTime: raw.T,
      eventTime: raw.E,
    };
  }
}
