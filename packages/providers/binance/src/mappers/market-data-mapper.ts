/**
 * `BinanceMarketDataMapper` — raw Binance market-data payloads (REST depth/klines, WS ticker/kline/
 * depth events) → canonical order book, kline and ticker models. Pure and deterministic. This maps
 * market-data *shapes* only; it never subscribes or fetches (that is the WS/REST client's job).
 */
import { num } from './parse';
import type { BinanceSymbolMapper } from './symbol-mapper';
import type {
  BinanceDepth,
  BinanceDepthEvent,
  BinanceKline,
  BinanceKlineEvent,
  BinanceSymbolInfo,
  BinanceTickerEvent,
} from '../types/binance';
import type {
  CanonicalBookLevel,
  CanonicalKline,
  CanonicalOrderBook,
  CanonicalTicker,
} from '../types/canonical';

function levels(rows: readonly [string, string][]): readonly CanonicalBookLevel[] {
  return rows.map(([price, quantity]) => ({ price: num(price), quantity: num(quantity) }));
}

export class BinanceMarketDataMapper {
  constructor(private readonly symbols: BinanceSymbolMapper) {}

  /** REST `depth` → canonical order book (symbol supplied by the caller — REST depth omits it). */
  depthToOrderBook(
    binanceSymbol: string,
    depth: BinanceDepth,
    info?: BinanceSymbolInfo,
  ): CanonicalOrderBook {
    return {
      symbol: this.symbols.toCanonicalSymbol(binanceSymbol, info),
      lastUpdateId: depth.lastUpdateId,
      bids: levels(depth.bids),
      asks: levels(depth.asks),
    };
  }

  /** WS `@depth` diff event → canonical order book. */
  depthEventToOrderBook(event: BinanceDepthEvent, info?: BinanceSymbolInfo): CanonicalOrderBook {
    return {
      symbol: this.symbols.toCanonicalSymbol(event.s, info),
      lastUpdateId: event.u,
      bids: levels(event.b),
      asks: levels(event.a),
    };
  }

  /** REST kline row → canonical kline (always closed). */
  klineRow(
    binanceSymbol: string,
    interval: string,
    row: BinanceKline,
    info?: BinanceSymbolInfo,
  ): CanonicalKline {
    return {
      symbol: this.symbols.toCanonicalSymbol(binanceSymbol, info),
      interval,
      openTime: row[0],
      closeTime: row[6],
      open: num(row[1]),
      high: num(row[2]),
      low: num(row[3]),
      close: num(row[4]),
      volume: num(row[5]),
      closed: true,
    };
  }

  /** WS `@kline` event → canonical kline. */
  klineEvent(event: BinanceKlineEvent, info?: BinanceSymbolInfo): CanonicalKline {
    const k = event.k;
    return {
      symbol: this.symbols.toCanonicalSymbol(event.s, info),
      interval: k.i,
      openTime: k.t,
      closeTime: k.T,
      open: num(k.o),
      high: num(k.h),
      low: num(k.l),
      close: num(k.c),
      volume: num(k.v),
      closed: k.x,
    };
  }

  /** WS `@ticker` event → canonical ticker. */
  tickerEvent(event: BinanceTickerEvent, info?: BinanceSymbolInfo): CanonicalTicker {
    return {
      symbol: this.symbols.toCanonicalSymbol(event.s, info),
      lastPrice: num(event.c),
      bidPrice: event.b ? num(event.b) : undefined,
      askPrice: event.a ? num(event.a) : undefined,
      at: event.E,
    };
  }
}
