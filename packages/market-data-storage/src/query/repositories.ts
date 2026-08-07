/**
 * The **typed repositories** — ergonomic, kind-specific views over the {@link MarketDataQueryRepository}.
 * Each returns the concrete canonical record type for its kind (so callers get `NormalizedTrade`
 * rather than the union), and each is a thin, read-only projection: no new storage behavior, just a
 * typed filter. They are the named repositories the storage architecture exposes to consumers; the
 * consumers still never touch the engine or database directly.
 */
import type {
  MarketDataEventKind,
  NormalizedAggregateTrade,
  NormalizedAveragePrice,
  NormalizedBookTicker,
  NormalizedCandlestick,
  NormalizedMarkPrice,
  NormalizedMarketDataRecord,
  NormalizedOrderBookDelta,
  NormalizedOrderBookSnapshot,
  NormalizedTicker,
  NormalizedTrade,
} from '@platform/market-data-ingestion';
import type { MarketDataQueryRepository, ReconstructedOrderBook } from './query-repository';

/** Base class: a read-only, kind-filtered view. */
abstract class KindRepository<R extends NormalizedMarketDataRecord> {
  protected constructor(
    protected readonly queries: MarketDataQueryRepository,
    private readonly kind: MarketDataEventKind,
  ) {}

  /** All records of this kind for an instrument (ascending by time). */
  async byInstrument(instrumentId: string): Promise<readonly R[]> {
    return (await this.queries.query({
      instrumentId,
      kind: this.kind,
      order: 'asc',
    })) as readonly R[];
  }

  /** Records within an inclusive primary-time range (ascending). */
  async byTimeRange(instrumentId: string, from: number, to: number): Promise<readonly R[]> {
    return (await this.queries.range(instrumentId, this.kind, from, to)) as readonly R[];
  }

  /** The most recent record of this kind for an instrument. */
  async latest(instrumentId: string): Promise<R | null> {
    return (await this.queries.latest(instrumentId, this.kind)) as R | null;
  }
}

export class TradeRepository extends KindRepository<NormalizedTrade> {
  constructor(queries: MarketDataQueryRepository) {
    super(queries, 'trade');
  }
}

export class AggregateTradeRepository extends KindRepository<NormalizedAggregateTrade> {
  constructor(queries: MarketDataQueryRepository) {
    super(queries, 'aggTrade');
  }
}

export class TickerRepository extends KindRepository<NormalizedTicker> {
  constructor(queries: MarketDataQueryRepository) {
    super(queries, 'ticker');
  }
}

export class BookTickerRepository extends KindRepository<NormalizedBookTicker> {
  constructor(queries: MarketDataQueryRepository) {
    super(queries, 'bookTicker');
  }
}

export class CandlestickRepository extends KindRepository<NormalizedCandlestick> {
  constructor(queries: MarketDataQueryRepository) {
    super(queries, 'candlestick');
  }

  /** Candlesticks of one interval within a time range (ascending). */
  async byInterval(
    instrumentId: string,
    interval: string,
    from: number,
    to: number,
  ): Promise<readonly NormalizedCandlestick[]> {
    return (await this.queries.query({
      instrumentId,
      kind: 'candlestick',
      interval,
      from,
      to,
      order: 'asc',
    })) as readonly NormalizedCandlestick[];
  }
}

export class MarkPriceRepository extends KindRepository<NormalizedMarkPrice> {
  constructor(queries: MarketDataQueryRepository) {
    super(queries, 'markPrice');
  }
}

export class AveragePriceRepository extends KindRepository<NormalizedAveragePrice> {
  constructor(queries: MarketDataQueryRepository) {
    super(queries, 'avgPrice');
  }
}

/**
 * The order-book repository — the snapshot/delta streams plus deterministic reconstruction. Snapshots
 * and deltas are stored separately (both under the ORDER_BOOKS type) so a book can be rebuilt from a
 * snapshot anchor and its ordered deltas.
 */
export class OrderBookRepository {
  constructor(private readonly queries: MarketDataQueryRepository) {}

  /** Stored snapshots for an instrument within a time range (ascending). */
  async snapshots(
    instrumentId: string,
    from = 0,
    to = Number.POSITIVE_INFINITY,
  ): Promise<readonly NormalizedOrderBookSnapshot[]> {
    return (await this.queries.range(
      instrumentId,
      'orderBookSnapshot',
      from,
      to,
    )) as readonly NormalizedOrderBookSnapshot[];
  }

  /** Stored deltas for an instrument within a time range (ascending). */
  async deltas(
    instrumentId: string,
    from = 0,
    to = Number.POSITIVE_INFINITY,
  ): Promise<readonly NormalizedOrderBookDelta[]> {
    return (await this.queries.range(
      instrumentId,
      'orderBookDelta',
      from,
      to,
    )) as readonly NormalizedOrderBookDelta[];
  }

  /** Reconstruct the book at a point in time (default: latest). */
  async reconstruct(instrumentId: string, atMs?: number): Promise<ReconstructedOrderBook | null> {
    return this.queries.reconstructOrderBook(instrumentId, atMs);
  }
}
