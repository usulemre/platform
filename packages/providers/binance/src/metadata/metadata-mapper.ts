/**
 * `ExchangeMetadataMapper` — a raw `GET .../exchangeInfo` payload → the canonical, immutable
 * {@link ExchangeMetadata} snapshot. It maps every instrument through the {@link ExchangeSymbolMapper}
 * and translates the exchange rate-limit descriptors, timezone and server clock. It stamps neither the
 * fetch time nor the source into wall-clock ambiently — `fetchedAt` is supplied by the caller so the
 * mapper stays pure and deterministic.
 */
import { ExchangeSymbolMapper } from './symbol-mapper';
import type { BinanceMarket } from '../constants';
import type { BinanceExchangeInfo, BinanceRateLimit } from '../types/binance';
import type { ExchangeMetadata, RateLimitMetadata } from './types';

const RATE_LIMIT_TYPE: Readonly<Record<string, RateLimitMetadata['type']>> = {
  REQUEST_WEIGHT: 'REQUEST_WEIGHT',
  ORDERS: 'ORDERS',
  RAW_REQUESTS: 'RAW_REQUESTS',
  CONNECTIONS: 'CONNECTIONS',
};

const INTERVAL_UNIT: Readonly<Record<string, RateLimitMetadata['intervalUnit']>> = {
  SECOND: 'SECOND',
  MINUTE: 'MINUTE',
  HOUR: 'HOUR',
  DAY: 'DAY',
};

export class ExchangeMetadataMapper {
  readonly symbols: ExchangeSymbolMapper;

  constructor(private readonly market: BinanceMarket) {
    this.symbols = new ExchangeSymbolMapper(market);
  }

  private rateLimit(limit: BinanceRateLimit): RateLimitMetadata {
    return {
      type: RATE_LIMIT_TYPE[limit.rateLimitType?.toUpperCase()] ?? 'UNKNOWN',
      intervalUnit: INTERVAL_UNIT[limit.interval?.toUpperCase()] ?? 'UNKNOWN',
      intervalNum: limit.intervalNum ?? 0,
      limit: limit.limit ?? 0,
    };
  }

  /** Full exchangeInfo → canonical metadata snapshot (`fetchedAt` supplied by the caller). */
  toCanonical(info: BinanceExchangeInfo, fetchedAt: string): ExchangeMetadata {
    return {
      source: 'binance',
      market: this.market,
      timezone: info.timezone ?? 'UTC',
      serverTime: info.serverTime ?? 0,
      rateLimits: (info.rateLimits ?? []).map((r) => this.rateLimit(r)),
      symbols: info.symbols.map((s) => this.symbols.toCanonical(s)),
      fetchedAt,
    };
  }
}
