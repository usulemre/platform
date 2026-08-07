/**
 * `EventRouter` — the single dispatch authority that turns a raw stream payload into a canonical
 * market-data event, selecting the correct validator + mapper from the stream name. It parses the
 * documented stream-name grammar (`<symbol>@<channel>[@<speed>ms]`, e.g. `btcusdt@kline_1m`,
 * `btcusdt@depth`, `btcusdt@ticker_1h`) and never guesses: an unrecognized channel yields `undefined`.
 * Validation failures propagate as {@link BinanceStreamValidationError}. Pure and deterministic.
 */
import { MarketDataValidator } from './validator';
import { EventMapper, type SymbolResolver } from './event-mapper';
import type { BinanceMarket } from '../constants';
import type { MarketDataEvent } from './events';

export class EventRouter {
  private readonly validator = new MarketDataValidator();
  private readonly mapper: EventMapper;

  constructor(market: BinanceMarket, resolver?: SymbolResolver) {
    this.mapper = new EventMapper(resolver, market);
  }

  /** Parse the channel token (`kline_1m`, `depth5`, `ticker_1h`, …) from a stream name. */
  private channelToken(streamName: string): { symbol: string; channel: string } {
    const parts = streamName.split('@');
    return { symbol: (parts[0] ?? '').toUpperCase(), channel: parts[1] ?? '' };
  }

  /** Map a raw payload for `streamName` to a canonical event, or `undefined` if unrecognized. */
  route(streamName: string, data: unknown): MarketDataEvent | undefined {
    const { symbol, channel } = this.channelToken(streamName);

    if (channel === 'aggTrade') return this.mapper.aggTrade(this.validator.aggTrade(data));
    if (channel === 'trade') return this.mapper.trade(this.validator.trade(data));
    if (channel === 'miniTicker') return this.mapper.miniTicker(this.validator.miniTicker(data));
    if (channel === 'ticker') return this.mapper.ticker(this.validator.ticker(data));
    if (channel.startsWith('ticker_'))
      return this.mapper.rollingTicker(this.validator.rollingTicker(data));
    if (channel === 'bookTicker') return this.mapper.bookTicker(this.validator.bookTicker(data));
    if (channel === 'avgPrice') return this.mapper.avgPrice(this.validator.avgPrice(data));
    if (channel === 'markPrice') return this.mapper.markPrice(this.validator.markPrice(data));
    if (channel.startsWith('kline_')) return this.mapper.kline(this.validator.kline(data));
    if (/^depth\d+$/.test(channel))
      return this.mapper.partialDepth(symbol, this.validator.partialDepth(data));
    if (channel === 'depth') return this.mapper.depthUpdate(this.validator.depthUpdate(data));
    return undefined;
  }
}
