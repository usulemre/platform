/**
 * `MarketDataValidator` — deterministic structural validation of raw Binance stream payloads before
 * they are mapped. It asserts that every documented required field is present and of the expected
 * primitive kind, throwing a {@link BinanceStreamValidationError} otherwise. This is the guard that
 * keeps malformed or unexpected payloads from reaching the canonical mappers and downstream consumers.
 * Pure; no IO.
 */
import { BinanceStreamValidationError } from './errors';
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

type Kind = 'string' | 'number' | 'boolean' | 'array' | 'object';

function kindOf(value: unknown): Kind | 'unknown' {
  if (value === null) return 'unknown';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'object') return t as Kind;
  return 'unknown';
}

export class MarketDataValidator {
  private require(
    stream: string,
    data: unknown,
    fields: Readonly<Record<string, Kind>>,
  ): Record<string, unknown> {
    if (kindOf(data) !== 'object')
      throw new BinanceStreamValidationError(stream, 'payload is not an object.');
    const obj = data as Record<string, unknown>;
    for (const [key, kind] of Object.entries(fields)) {
      const actual = kindOf(obj[key]);
      if (actual !== kind)
        throw new BinanceStreamValidationError(
          stream,
          `field "${key}" expected ${kind}, got ${actual}.`,
        );
    }
    return obj;
  }

  trade(data: unknown): BinanceRawTrade {
    this.require('trade', data, {
      s: 'string',
      t: 'number',
      p: 'string',
      q: 'string',
      T: 'number',
      m: 'boolean',
      E: 'number',
    });
    return data as BinanceRawTrade;
  }

  aggTrade(data: unknown): BinanceRawAggTrade {
    this.require('aggTrade', data, {
      s: 'string',
      a: 'number',
      p: 'string',
      q: 'string',
      f: 'number',
      l: 'number',
      T: 'number',
      m: 'boolean',
      E: 'number',
    });
    return data as BinanceRawAggTrade;
  }

  miniTicker(data: unknown): BinanceRawMiniTicker {
    this.require('miniTicker', data, {
      s: 'string',
      c: 'string',
      o: 'string',
      h: 'string',
      l: 'string',
      v: 'string',
      q: 'string',
      E: 'number',
    });
    return data as BinanceRawMiniTicker;
  }

  ticker(data: unknown): BinanceRawTicker {
    this.require('ticker', data, {
      s: 'string',
      c: 'string',
      o: 'string',
      h: 'string',
      l: 'string',
      v: 'string',
      q: 'string',
      p: 'string',
      P: 'string',
      w: 'string',
      n: 'number',
      E: 'number',
    });
    return data as BinanceRawTicker;
  }

  rollingTicker(data: unknown): BinanceRawRollingTicker {
    this.require('rollingTicker', data, {
      s: 'string',
      c: 'string',
      o: 'string',
      h: 'string',
      l: 'string',
      v: 'string',
      q: 'string',
      p: 'string',
      P: 'string',
      w: 'string',
      n: 'number',
      E: 'number',
    });
    return data as BinanceRawRollingTicker;
  }

  bookTicker(data: unknown): BinanceRawBookTicker {
    this.require('bookTicker', data, {
      u: 'number',
      s: 'string',
      b: 'string',
      B: 'string',
      a: 'string',
      A: 'string',
    });
    return data as BinanceRawBookTicker;
  }

  partialDepth(data: unknown): BinanceRawPartialDepth {
    this.require('partialDepth', data, {
      lastUpdateId: 'number',
      bids: 'array',
      asks: 'array',
    });
    return data as BinanceRawPartialDepth;
  }

  depthUpdate(data: unknown): BinanceRawDepthUpdate {
    this.require('depthUpdate', data, {
      s: 'string',
      U: 'number',
      u: 'number',
      b: 'array',
      a: 'array',
      E: 'number',
    });
    return data as BinanceRawDepthUpdate;
  }

  kline(data: unknown): BinanceRawKline {
    const obj = this.require('kline', data, { s: 'string', k: 'object', E: 'number' });
    this.require('kline.k', obj['k'], {
      t: 'number',
      T: 'number',
      i: 'string',
      o: 'string',
      c: 'string',
      h: 'string',
      l: 'string',
      v: 'string',
      n: 'number',
      x: 'boolean',
      q: 'string',
      V: 'string',
      Q: 'string',
      f: 'number',
      L: 'number',
    });
    return data as BinanceRawKline;
  }

  avgPrice(data: unknown): BinanceRawAvgPrice {
    this.require('avgPrice', data, {
      s: 'string',
      i: 'string',
      w: 'string',
      T: 'number',
      E: 'number',
    });
    return data as BinanceRawAvgPrice;
  }

  markPrice(data: unknown): BinanceRawMarkPrice {
    this.require('markPrice', data, {
      s: 'string',
      p: 'string',
      i: 'string',
      P: 'string',
      r: 'string',
      T: 'number',
      E: 'number',
    });
    return data as BinanceRawMarkPrice;
  }
}
