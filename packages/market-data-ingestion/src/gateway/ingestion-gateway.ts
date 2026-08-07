/**
 * The **market-data ingestion gateway** — the pipeline's public façade and intake point. Provider
 * adapters push canonical events in via {@link ingest} (it implements {@link MarketDataConsumer}); the
 * gateway stamps a receive time from the injected clock, runs the event through the deterministic
 * {@link IngestionPipeline}, and exposes the operational surface: flush-to-store, health, metrics,
 * dead letters, and per-stream state. It composes the buffer, batch processor, store, and monitors so
 * a caller wires the whole ingestion layer from one options object.
 *
 * Provider-independent: the gateway depends only on the provider-neutral contracts in
 * {@link ../provider/provider-source}. Attaching Binance (or any venue) is `connect(source)` with an
 * adapter that implements {@link ProviderMarketDataSource}; the gateway imports no provider code.
 */
import { SystemClock, type Clock } from '../clock';
import {
  BatchProcessor,
  type BatchOutcome,
  type BatchProcessorConfig,
} from '../buffer/batch-processor';
import { IngestionBuffer, type IngestionBufferConfig } from '../buffer/ingestion-buffer';
import { DeadLetterQueue, type DeadLetterEntry } from '../dead-letter/dead-letter-queue';
import type { NormalizedMarketDataRecord } from '../events/envelope';
import {
  IngestionHealthMonitor,
  type HealthThresholds,
  type IngestionHealth,
} from '../health/health-monitor';
import type { InstrumentRegistry } from '../instruments/instrument-registry';
import { IngestionMetrics, type IngestionMetricsSnapshot } from '../metrics/ingestion-metrics';
import { IngestionPipeline } from '../pipeline/pipeline';
import type {
  IngestionResult,
  MarketDataConsumer,
  OrderBookSnapshotSource,
  ProviderMarketDataEvent,
  ProviderMarketDataSource,
} from '../provider/provider-source';
import { IngestionStateManager, type StreamStateSnapshot } from '../state/ingestion-state';
import type { CanonicalMarketDataStore } from '../store/market-data-store';
import type { DataQualityConfig } from '../validation/data-quality-validator';
import type { LocalOrderBook } from '../orderbook/order-book-state';
import type { OrderBookSyncState } from '../orderbook/order-book-synchronizer';

export interface MarketDataIngestionGatewayOptions {
  readonly store: CanonicalMarketDataStore;
  readonly registry: InstrumentRegistry;
  readonly clock?: Clock;
  readonly snapshotSource?: OrderBookSnapshotSource;
  readonly buffer?: Partial<IngestionBufferConfig>;
  readonly batch?: Partial<BatchProcessorConfig>;
  readonly dataQuality?: Partial<DataQualityConfig>;
  readonly duplicateWindow?: number;
  readonly deadLetterCapacity?: number;
  readonly healthThresholds?: Partial<HealthThresholds>;
}

export class MarketDataIngestionGateway implements MarketDataConsumer {
  private readonly clock: Clock;
  private readonly buffer: IngestionBuffer<NormalizedMarketDataRecord>;
  private readonly deadLetter: DeadLetterQueue;
  private readonly metrics = new IngestionMetrics();
  private readonly state = new IngestionStateManager();
  private readonly pipeline: IngestionPipeline;
  private readonly batchProcessor: BatchProcessor;
  private readonly healthMonitor: IngestionHealthMonitor;
  private readonly sources = new Map<string, ProviderMarketDataSource>();

  constructor(options: MarketDataIngestionGatewayOptions) {
    this.clock = options.clock ?? new SystemClock();
    this.buffer = new IngestionBuffer<NormalizedMarketDataRecord>(options.buffer);
    this.deadLetter = new DeadLetterQueue(
      options.deadLetterCapacity !== undefined ? { capacity: options.deadLetterCapacity } : {},
    );
    this.pipeline = new IngestionPipeline({
      registry: options.registry,
      buffer: this.buffer,
      deadLetter: this.deadLetter,
      metrics: this.metrics,
      state: this.state,
      clock: this.clock,
      ...(options.snapshotSource ? { snapshotSource: options.snapshotSource } : {}),
      ...(options.dataQuality ? { dataQuality: options.dataQuality } : {}),
      ...(options.duplicateWindow !== undefined
        ? { duplicateWindow: options.duplicateWindow }
        : {}),
    });
    this.batchProcessor = new BatchProcessor({
      buffer: this.buffer,
      store: options.store,
      deadLetter: this.deadLetter,
      metrics: this.metrics,
      clock: this.clock,
      ...(options.batch ? { config: options.batch } : {}),
    });
    this.healthMonitor = new IngestionHealthMonitor(options.healthThresholds);
  }

  /** Intake one provider event (implements {@link MarketDataConsumer}). */
  async ingest(input: ProviderMarketDataEvent): Promise<IngestionResult> {
    const receiveTime = input.receivedAt ?? this.clock.now();
    this.metrics.onReceived(receiveTime);
    return this.pipeline.process({
      providerId: input.providerId,
      event: input.event,
      receiveTime,
    });
  }

  /** Attach a provider stream and begin ingesting from it. */
  async connect(source: ProviderMarketDataSource): Promise<void> {
    this.sources.set(source.providerId, source);
    await source.start(this);
  }

  /** Detach a provider stream. */
  async disconnect(providerId: string): Promise<void> {
    const source = this.sources.get(providerId);
    if (!source) return;
    await source.stop();
    this.sources.delete(providerId);
  }

  /** Drain the buffer into the canonical store (one batch). */
  async flushOnce(): Promise<BatchOutcome | null> {
    return this.batchProcessor.drainOnce();
  }

  /** Drain the buffer into the canonical store until empty. */
  async flush(): Promise<BatchOutcome[]> {
    return this.batchProcessor.drainAll();
  }

  /** A live metrics snapshot (buffer depth and degraded-stream gauges are refreshed first). */
  metricsSnapshot(): IngestionMetricsSnapshot {
    this.metrics.setBufferDepth(this.buffer.depth);
    this.metrics.setDegradedStreams(this.state.degradedCount());
    return this.metrics.snapshot();
  }

  /** Evaluate pipeline health at the current (or supplied) time. */
  health(now: number = this.clock.now()): IngestionHealth {
    return this.healthMonitor.evaluate({
      metrics: this.metricsSnapshot(),
      bufferCapacity: this.buffer.capacity,
      now,
    });
  }

  /** Current quarantined (dead-lettered) entries. */
  deadLetters(): readonly DeadLetterEntry[] {
    return this.deadLetter.list();
  }

  /** Per-stream operational state. */
  streamState(streamKey: string): StreamStateSnapshot | undefined {
    return this.state.get(streamKey);
  }

  streamStates(): readonly StreamStateSnapshot[] {
    return this.state.all();
  }

  /** The maintained order book for a stream (for consumers wanting current book state). */
  orderBook(streamKey: string): LocalOrderBook | undefined {
    return this.pipeline.orderBookSynchronizer.bookOf(streamKey);
  }

  /** The synchronization state of an order-book stream. */
  orderBookState(streamKey: string): OrderBookSyncState {
    return this.pipeline.orderBookSynchronizer.stateOf(streamKey);
  }
}
