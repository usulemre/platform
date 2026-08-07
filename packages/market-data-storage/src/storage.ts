/**
 * `MarketDataStorage` — the canonical storage layer's public façade. It composes the engine, writer,
 * query repository, typed repositories, partition/retention managers, validator, metrics, and health
 * monitor into one object, and it **implements the ingestion pipeline's `CanonicalMarketDataStore`
 * port**, so it plugs directly into the Phase 10.1 gateway: `new MarketDataIngestionGateway({ store:
 * new MarketDataStorage(...) })`. That wiring is the only supported market-data persistence path
 * (Provider → Ingestion → Canonical Storage).
 *
 * Provider-independent: it depends only on canonical models (`@platform/market-data-ingestion`,
 * `@platform/market-data-sdk`) — never on a provider. Consumers read exclusively through the
 * repositories/queries here; they never touch the engine or an underlying database.
 */
import type {
  CanonicalMarketDataStore,
  Clock,
  NormalizedMarketDataRecord,
} from '@platform/market-data-ingestion';
import { SystemClock } from '@platform/market-data-ingestion';
import { StorageDeadLetterQueue, type QuarantineEntry } from './dead-letter';
import { InMemoryStorageEngine, type StorageEngine } from './engine/storage-engine';
import {
  StorageHealthMonitor,
  type StorageHealth,
  type StorageHealthThresholds,
} from './health/storage-health-monitor';
import { StorageMetrics, type StorageMetricsSnapshot } from './metrics/storage-metrics';
import { StoragePartitionManager } from './partition';
import { MarketDataQueryRepository, type ReconstructedOrderBook } from './query/query-repository';
import {
  MarketDataQueryEngine,
  type MarketDataQueryEngineOptions,
} from './query/market-data-query-engine';
import type { StorageAvailabilityProbe } from './query/query-health';
import {
  AggregateTradeRepository,
  AveragePriceRepository,
  BookTickerRepository,
  CandlestickRepository,
  MarkPriceRepository,
  OrderBookRepository,
  TickerRepository,
  TradeRepository,
} from './query/repositories';
import {
  StorageRetentionManager,
  type RetentionPlanItem,
  type RetentionPolicy,
  type RetentionReport,
} from './retention/retention-manager';
import { StorageValidator } from './validation/storage-validator';
import {
  MarketDataBatchWriter,
  MarketDataWriter,
  type MarketDataBatchWriterConfig,
  type MarketDataWriterConfig,
  type WriteResult,
} from './write/market-data-writer';

export interface MarketDataStorageOptions {
  readonly engine?: StorageEngine;
  readonly clock?: Clock;
  readonly retention?: RetentionPolicy;
  readonly writer?: Partial<MarketDataWriterConfig>;
  readonly batch?: Partial<MarketDataBatchWriterConfig>;
  readonly deadLetterCapacity?: number;
  readonly healthThresholds?: Partial<StorageHealthThresholds>;
  /** Tune the canonical Query Engine (limits, slow-query threshold). */
  readonly queryEngine?: Pick<
    MarketDataQueryEngineOptions,
    'defaultLimit' | 'maxLimit' | 'slowQueryThresholdMs'
  >;
}

/** A storage engine that can report live liveness (the ClickHouse engine does). */
function asAvailabilityProbe(engine: StorageEngine): StorageAvailabilityProbe | undefined {
  const candidate = engine as Partial<StorageAvailabilityProbe>;
  return typeof candidate.ping === 'function'
    ? { ping: () => (candidate.ping as StorageAvailabilityProbe['ping'])() }
    : undefined;
}

export class MarketDataStorage implements CanonicalMarketDataStore {
  private readonly clock: Clock;
  private readonly engine: StorageEngine;
  private readonly metrics = new StorageMetrics();
  private readonly deadLetter: StorageDeadLetterQueue;
  private readonly partitionManager = new StoragePartitionManager();
  private readonly writer: MarketDataWriter;
  private readonly batchWriter: MarketDataBatchWriter;
  private readonly queryRepository: MarketDataQueryRepository;
  private readonly queryEngine: MarketDataQueryEngine;
  private readonly retentionManager: StorageRetentionManager;
  private readonly healthMonitor: StorageHealthMonitor;

  // Typed repositories (the named read surface).
  readonly trades: TradeRepository;
  readonly aggregateTrades: AggregateTradeRepository;
  readonly tickers: TickerRepository;
  readonly bookTickers: BookTickerRepository;
  readonly candlesticks: CandlestickRepository;
  readonly markPrices: MarkPriceRepository;
  readonly averagePrices: AveragePriceRepository;
  readonly orderBooks: OrderBookRepository;

  constructor(options: MarketDataStorageOptions = {}) {
    this.clock = options.clock ?? new SystemClock();
    this.engine = options.engine ?? new InMemoryStorageEngine();
    this.deadLetter = new StorageDeadLetterQueue(options.deadLetterCapacity);
    this.writer = new MarketDataWriter({
      engine: this.engine,
      metrics: this.metrics,
      deadLetter: this.deadLetter,
      clock: this.clock,
      validator: new StorageValidator(),
      partitionManager: this.partitionManager,
      ...(options.writer ? { config: options.writer } : {}),
    });
    this.batchWriter = new MarketDataBatchWriter(this.writer, this.metrics, options.batch);
    this.queryRepository = new MarketDataQueryRepository({
      engine: this.engine,
      metrics: this.metrics,
      clock: this.clock,
      partitionManager: this.partitionManager,
    });
    const probe = asAvailabilityProbe(this.engine);
    this.queryEngine = new MarketDataQueryEngine({
      repository: this.queryRepository,
      clock: this.clock,
      ...(probe ? { availabilityProbe: probe } : {}),
      ...(options.queryEngine ?? {}),
    });
    this.retentionManager = new StorageRetentionManager(
      this.engine,
      options.retention ?? {},
      this.metrics,
    );
    this.healthMonitor = new StorageHealthMonitor(options.healthThresholds);

    this.trades = new TradeRepository(this.queryRepository);
    this.aggregateTrades = new AggregateTradeRepository(this.queryRepository);
    this.tickers = new TickerRepository(this.queryRepository);
    this.bookTickers = new BookTickerRepository(this.queryRepository);
    this.candlesticks = new CandlestickRepository(this.queryRepository);
    this.markPrices = new MarkPriceRepository(this.queryRepository);
    this.averagePrices = new AveragePriceRepository(this.queryRepository);
    this.orderBooks = new OrderBookRepository(this.queryRepository);
  }

  // ---- Write path ----------------------------------------------------------

  /** Implements `CanonicalMarketDataStore` — the ingestion pipeline's durable append. */
  async append(records: readonly NormalizedMarketDataRecord[]): Promise<void> {
    const result = await this.writer.writeBatch(records);
    // The port is fire-and-forget for the pipeline; a total engine failure must surface as an error
    // so the pipeline's own batch processor can retry/dead-letter, rather than silently succeeding.
    if (
      result.attempted > 0 &&
      result.persisted === 0 &&
      result.failed > 0 &&
      result.rejected === 0
    ) {
      throw new Error('Storage engine failed to persist any record in the batch.');
    }
  }

  /** Persist a single record (validated, idempotent). */
  async write(record: NormalizedMarketDataRecord): Promise<WriteResult> {
    return this.writer.write(record);
  }

  /** Persist a batch (validated, idempotent, partial-failure safe). */
  async writeBatch(records: readonly NormalizedMarketDataRecord[]): Promise<WriteResult> {
    return this.writer.writeBatch(records);
  }

  /** The buffered batch writer (for callers that accumulate before flushing). */
  get buffered(): MarketDataBatchWriter {
    return this.batchWriter;
  }

  // ---- Read path -----------------------------------------------------------

  /** The canonical query repository (time-range/instrument/latest/historical/reconstruction). */
  get queries(): MarketDataQueryRepository {
    return this.queryRepository;
  }

  /**
   * The canonical **Market Data Query Engine** — the read/query abstraction consumers (Dataset /
   * Research / Feature / Factor / Backtesting / Python Quant Runtime) use for validated, paginated,
   * provider- and storage-independent access. It adds query validation, keyset pagination, sequence
   * filtering, canonical error mapping, query metrics, and storage-backed health over {@link queries}.
   */
  get engineQueries(): MarketDataQueryEngine {
    return this.queryEngine;
  }

  /** Reconstruct an instrument's order book at a point in time (default: latest). */
  async reconstructOrderBook(
    instrumentId: string,
    atMs?: number,
  ): Promise<ReconstructedOrderBook | null> {
    return this.queryRepository.reconstructOrderBook(instrumentId, atMs);
  }

  // ---- Lifecycle & observability ------------------------------------------

  /** A non-destructive retention plan at `now`. */
  planRetention(now: number = this.clock.now()): readonly RetentionPlanItem[] {
    return this.retentionManager.plan(now);
  }

  /** Apply retention (delete expired partitions). Explicit and observable. */
  async applyRetention(now: number = this.clock.now()): Promise<RetentionReport> {
    return this.retentionManager.apply(now);
  }

  /** Enumerate held partitions. */
  partitions(): readonly string[] {
    return this.engine.listPartitions();
  }

  /** Live metrics snapshot. */
  metricsSnapshot(): StorageMetricsSnapshot {
    return this.metrics.snapshot();
  }

  /** Evaluate storage health at the current (or supplied) time. */
  health(now: number = this.clock.now()): StorageHealth {
    return this.healthMonitor.evaluate({ metrics: this.metrics.snapshot(), now });
  }

  /** Current quarantined records. */
  deadLetters(): readonly QuarantineEntry[] {
    return this.deadLetter.list();
  }

  /** Total stored entry count (diagnostics). */
  size(): number {
    return this.engine.count();
  }
}
