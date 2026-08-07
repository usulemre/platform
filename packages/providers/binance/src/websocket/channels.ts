/**
 * `ChannelRegistry` — the catalog of supported Binance market-data channels and the single place that
 * builds officially-documented stream names (e.g. `btcusdt@aggTrade`, `btcusdt@kline_1m`,
 * `btcusdt@depth@100ms`, `btcusdt@ticker_1h`). It also records each channel's market applicability
 * (Spot/Futures/both), whether it drives order-book synchronization, and the documented enum values
 * (kline intervals, rolling windows, depth levels, update speeds). No stream name, interval, window,
 * level or speed outside the official specification is produced. Pure and deterministic.
 */
import { BinanceChannelUnavailableError } from './errors';
import type { BinanceMarket } from '../constants';

/** The canonical market-data channels this module supports. */
export type MarketDataChannel =
  | 'trade'
  | 'aggTrade'
  | 'miniTicker'
  | 'ticker'
  | 'rollingTicker'
  | 'bookTicker'
  | 'partialDepth'
  | 'diffDepth'
  | 'kline'
  | 'avgPrice'
  | 'markPrice';

type MarketScope = 'BOTH' | 'SPOT' | 'FUTURES';

interface ChannelDescriptor {
  readonly channel: MarketDataChannel;
  readonly scope: MarketScope;
  /** Whether this channel is a diff stream that drives a maintained local order book. */
  readonly drivesOrderBook: boolean;
}

const CHANNELS: readonly ChannelDescriptor[] = [
  { channel: 'trade', scope: 'BOTH', drivesOrderBook: false },
  { channel: 'aggTrade', scope: 'BOTH', drivesOrderBook: false },
  { channel: 'miniTicker', scope: 'BOTH', drivesOrderBook: false },
  { channel: 'ticker', scope: 'BOTH', drivesOrderBook: false },
  { channel: 'rollingTicker', scope: 'SPOT', drivesOrderBook: false },
  { channel: 'bookTicker', scope: 'BOTH', drivesOrderBook: false },
  { channel: 'partialDepth', scope: 'BOTH', drivesOrderBook: false },
  { channel: 'diffDepth', scope: 'BOTH', drivesOrderBook: true },
  { channel: 'kline', scope: 'BOTH', drivesOrderBook: false },
  { channel: 'avgPrice', scope: 'SPOT', drivesOrderBook: false },
  { channel: 'markPrice', scope: 'FUTURES', drivesOrderBook: false },
];

/** Officially-documented Spot kline intervals (Futures shares these minus `1s`). */
export const KLINE_INTERVALS_SPOT = [
  '1s',
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '4h',
  '6h',
  '8h',
  '12h',
  '1d',
  '3d',
  '1w',
  '1M',
] as const;
export const KLINE_INTERVALS_FUTURES = KLINE_INTERVALS_SPOT.filter((i) => i !== '1s');

/** Documented rolling-window sizes for `@ticker_<window>` (Spot). */
export const ROLLING_WINDOWS = ['1h', '4h', '1d'] as const;
export type RollingWindow = (typeof ROLLING_WINDOWS)[number];

/** Documented partial-book depth levels. */
export const DEPTH_LEVELS = [5, 10, 20] as const;
export type DepthLevel = (typeof DEPTH_LEVELS)[number];

/** Documented update speeds (ms) per market. */
export const UPDATE_SPEEDS_SPOT = [1000, 100] as const;
export const UPDATE_SPEEDS_FUTURES = [250, 500, 100] as const;

/** Rolling-window ms for a documented window size. */
export const ROLLING_WINDOW_MS: Readonly<Record<RollingWindow, number>> = {
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
};

const DESCRIPTOR_BY_CHANNEL = new Map(CHANNELS.map((c) => [c.channel, c] as const));

function lower(symbol: string): string {
  return symbol.replace(/[-/_]/g, '').toLowerCase();
}

export class ChannelRegistry {
  constructor(private readonly market: BinanceMarket) {}

  /** All channels available on the configured market. */
  available(): readonly MarketDataChannel[] {
    return CHANNELS.filter((c) => this.isScoped(c)).map((c) => c.channel);
  }

  private isScoped(descriptor: ChannelDescriptor): boolean {
    return (
      descriptor.scope === 'BOTH' ||
      (descriptor.scope === 'SPOT' && this.market === 'SPOT') ||
      (descriptor.scope === 'FUTURES' && this.market === 'FUTURES')
    );
  }

  /** Whether a channel is available on the configured market. */
  supports(channel: MarketDataChannel): boolean {
    const descriptor = DESCRIPTOR_BY_CHANNEL.get(channel);
    return descriptor !== undefined && this.isScoped(descriptor);
  }

  /** Whether a channel drives a maintained local order book. */
  drivesOrderBook(channel: MarketDataChannel): boolean {
    return DESCRIPTOR_BY_CHANNEL.get(channel)?.drivesOrderBook ?? false;
  }

  private require(channel: MarketDataChannel): void {
    if (!this.supports(channel)) throw new BinanceChannelUnavailableError(channel, this.market);
  }

  private klineIntervals(): readonly string[] {
    return this.market === 'FUTURES' ? KLINE_INTERVALS_FUTURES : KLINE_INTERVALS_SPOT;
  }

  private updateSpeeds(): readonly number[] {
    return this.market === 'FUTURES' ? UPDATE_SPEEDS_FUTURES : UPDATE_SPEEDS_SPOT;
  }

  private speedSuffix(speedMs?: number): string {
    if (speedMs === undefined) return '';
    if (!this.updateSpeeds().includes(speedMs))
      throw new BinanceChannelUnavailableError(`depth@${speedMs}ms`, this.market);
    return `@${speedMs}ms`;
  }

  /* ------------------------------ stream-name builders ------------------------------ */

  trade(symbol: string): string {
    this.require('trade');
    return `${lower(symbol)}@trade`;
  }
  aggTrade(symbol: string): string {
    this.require('aggTrade');
    return `${lower(symbol)}@aggTrade`;
  }
  miniTicker(symbol: string): string {
    this.require('miniTicker');
    return `${lower(symbol)}@miniTicker`;
  }
  ticker(symbol: string): string {
    this.require('ticker');
    return `${lower(symbol)}@ticker`;
  }
  rollingTicker(symbol: string, window: RollingWindow): string {
    this.require('rollingTicker');
    if (!ROLLING_WINDOWS.includes(window))
      throw new BinanceChannelUnavailableError(`ticker_${window}`, this.market);
    return `${lower(symbol)}@ticker_${window}`;
  }
  bookTicker(symbol: string): string {
    this.require('bookTicker');
    return `${lower(symbol)}@bookTicker`;
  }
  partialDepth(symbol: string, levels: DepthLevel, speedMs?: number): string {
    this.require('partialDepth');
    if (!DEPTH_LEVELS.includes(levels))
      throw new BinanceChannelUnavailableError(`depth${levels}`, this.market);
    return `${lower(symbol)}@depth${levels}${this.speedSuffix(speedMs)}`;
  }
  diffDepth(symbol: string, speedMs?: number): string {
    this.require('diffDepth');
    return `${lower(symbol)}@depth${this.speedSuffix(speedMs)}`;
  }
  kline(symbol: string, interval: string): string {
    this.require('kline');
    if (!this.klineIntervals().includes(interval))
      throw new BinanceChannelUnavailableError(`kline_${interval}`, this.market);
    return `${lower(symbol)}@kline_${interval}`;
  }
  avgPrice(symbol: string): string {
    this.require('avgPrice');
    return `${lower(symbol)}@avgPrice`;
  }
  markPrice(symbol: string, everySecond = false): string {
    this.require('markPrice');
    return `${lower(symbol)}@markPrice${everySecond ? '@1s' : ''}`;
  }
}
