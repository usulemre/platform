/**
 * The **ingestion pipeline** — the deterministic heart of the ingestion core. It runs one canonical
 * event through the fixed stage chain and returns a structured {@link IngestionResult}; it never
 * throws on the normal path. The chain is:
 *
 *   route → schema-validate → resolve-symbol → quality-validate → normalize-timestamps →
 *     (order-book: synchronize · gap → degrade → recover) | (sequenced: dedup · sequence-check) →
 *     canonical-normalize → buffer (backpressure) → [batch-processor → store]
 *
 * Every rejection is observable: the offending payload is quarantined in the dead-letter queue with a
 * reason and metrics/stream-state are updated. Provider-neutral throughout — it imports no provider
 * code; the only provider seam is the injected {@link OrderBookSnapshotSource} used for recovery.
 */
import type { Clock } from '../clock';
import type { DeadLetterQueue } from '../dead-letter/dead-letter-queue';
import {
  streamKey as computeStreamKey,
  sequenceNumber,
  type RawMarketDataEvent,
  type RawOrderBookSnapshotEvent,
} from '../events/canonical-events';
import type { IngestionEnvelope, NormalizedMarketDataRecord } from '../events/envelope';
import type { InstrumentRegistry } from '../instruments/instrument-registry';
import type { IngestionMetrics } from '../metrics/ingestion-metrics';
import { CanonicalNormalizer } from '../normalization/canonical-normalizer';
import { SymbolNormalizer } from '../normalization/symbol-normalizer';
import { TimestampNormalizer } from '../normalization/timestamp-normalizer';
import { OrderBookSynchronizer } from '../orderbook/order-book-synchronizer';
import type { IngestionResult, OrderBookSnapshotSource } from '../provider/provider-source';
import { IngestionRouter } from '../routing/ingestion-router';
import { DuplicateDetector } from '../sequencing/duplicate-detector';
import { SequenceValidator } from '../sequencing/sequence-validator';
import { IngestionStateManager } from '../state/ingestion-state';
import type { IngestionBuffer } from '../buffer/ingestion-buffer';
import { DataQualityValidator, type DataQualityConfig } from '../validation/data-quality-validator';
import { SchemaValidator } from '../validation/schema-validator';
import type { Rejection } from '../validation/validation-result';

export interface IngestionPipelineDeps {
  readonly registry: InstrumentRegistry;
  readonly buffer: IngestionBuffer<NormalizedMarketDataRecord>;
  readonly deadLetter: DeadLetterQueue;
  readonly metrics: IngestionMetrics;
  readonly state: IngestionStateManager;
  readonly clock: Clock;
  /** Optional provider-neutral snapshot source for order-book recovery. */
  readonly snapshotSource?: OrderBookSnapshotSource;
  readonly dataQuality?: Partial<DataQualityConfig>;
  readonly duplicateWindow?: number;
}

export interface IngestInput {
  readonly providerId: string;
  readonly event: RawMarketDataEvent;
  readonly receiveTime: number;
}

export class IngestionPipeline {
  private readonly router = new IngestionRouter();
  private readonly schema = new SchemaValidator();
  private readonly quality: DataQualityValidator;
  private readonly symbols: SymbolNormalizer;
  private readonly timestamps = new TimestampNormalizer();
  private readonly normalizer = new CanonicalNormalizer();
  private readonly sequence = new SequenceValidator();
  private readonly duplicates: DuplicateDetector;
  private readonly orderBook = new OrderBookSynchronizer();
  private ingestSeq = 0;

  constructor(private readonly deps: IngestionPipelineDeps) {
    this.quality = new DataQualityValidator(deps.dataQuality);
    this.symbols = new SymbolNormalizer(deps.registry);
    this.duplicates = new DuplicateDetector(deps.duplicateWindow);
  }

  /** The order-book synchronizer, exposed for querying maintained book state. */
  get orderBookSynchronizer(): OrderBookSynchronizer {
    return this.orderBook;
  }

  /** Run one event through the full stage chain. */
  async process(input: IngestInput): Promise<IngestionResult> {
    const { providerId, event, receiveTime } = input;
    const key = computeStreamKey(providerId, event);

    // Stage 1 — schema (structural) validation.
    const schemaResult = this.schema.validate(event);
    if (!schemaResult.valid) {
      return this.reject(key, providerId, 'schema', schemaResult.rejection, event);
    }

    // Stage 2 — symbol resolution to a canonical instrument.
    const resolution = this.symbols.resolve(providerId, event.providerSymbol);
    if (!resolution.resolved) {
      return this.reject(key, providerId, 'symbol', resolution.rejection, event);
    }
    const instrumentId = resolution.instrument.instrumentId;

    // Stage 3 — data-quality (semantic) validation.
    const qualityResult = this.quality.validate(event, receiveTime);
    if (!qualityResult.valid) {
      return this.reject(key, providerId, 'quality', qualityResult.rejection, event, instrumentId);
    }

    // Stage 4 — build the in-flight envelope.
    const envelope: IngestionEnvelope = {
      providerId,
      streamKey: key,
      event,
      receiveTime,
      ingestSequence: (this.ingestSeq += 1),
    };

    const route = this.router.route(event);

    // Stage 5 — order-book events take the synchronizer path.
    if (route.orderBook) {
      return this.handleOrderBook(envelope, instrumentId);
    }

    // Stage 6 — sequenced streams: duplicate + order checks.
    if (route.sequenced) {
      const seq = sequenceNumber(event);
      if (seq !== undefined) {
        if (this.duplicates.check(key, seq)) {
          this.deps.metrics.onDuplicate();
          this.deps.state.recordDuplicate(key);
          return { outcome: 'duplicate', streamKey: key, instrumentId };
        }
        const check = this.sequence.classify(key, seq, { contiguous: route.contiguous });
        if (check.status === 'duplicate') {
          this.deps.metrics.onDuplicate();
          this.deps.state.recordDuplicate(key);
          return { outcome: 'duplicate', streamKey: key, instrumentId };
        }
        if (check.status === 'out_of_order') {
          this.deps.metrics.onOutOfOrder();
          return { outcome: 'out_of_order', streamKey: key, instrumentId };
        }
        if (check.status === 'gap') {
          // For monotonic (non-order-book) streams a gap means missed events; we still ingest what
          // arrived, but record the gap so the loss is observable.
          this.deps.metrics.onGap();
        }
      }
    }

    // Stage 7 — normalize and enqueue.
    return this.normalizeAndEnqueue(envelope, instrumentId, event);
  }

  private async handleOrderBook(
    envelope: IngestionEnvelope,
    instrumentId: string,
  ): Promise<IngestionResult> {
    const event = envelope.event;
    const key = envelope.streamKey;

    if (event.kind === 'orderBookSnapshot') {
      this.orderBook.onSnapshot(key, event);
      this.deps.state.markSynchronized(key);
      return this.normalizeAndEnqueue(envelope, instrumentId, event);
    }

    if (event.kind !== 'orderBookDelta') {
      // Unreachable given the router, but fail closed rather than assume.
      return this.reject(
        key,
        envelope.providerId,
        'order_book',
        { code: 'UNSUPPORTED_EVENT', message: `Unsupported order-book event '${event.kind}'.` },
        event,
        instrumentId,
      );
    }

    const result = this.orderBook.onDelta(key, event);
    if (result.applied) {
      this.deps.state.markSynchronized(key);
      return this.normalizeAndEnqueue(envelope, instrumentId, event);
    }

    // Not applied — buffered inside the synchronizer, awaiting (re)synchronization.
    const hadGap = result.needsSnapshot && result.state === 'DEGRADED';
    if (hadGap) {
      this.deps.metrics.onGap();
      this.deps.state.markDegraded(key);
    }

    if (this.deps.snapshotSource) {
      this.deps.state.markRecovering(key);
      return this.recover(envelope, instrumentId, hadGap);
    }

    // No snapshot source: the delta stays buffered; the stream is not yet synchronized.
    return {
      outcome: 'degraded',
      streamKey: key,
      instrumentId,
      reason: result.reason ?? 'Order book awaiting snapshot.',
      reasonCode: 'ORDER_BOOK_DESYNC',
    };
  }

  private async recover(
    envelope: IngestionEnvelope,
    instrumentId: string,
    hadGap: boolean,
  ): Promise<IngestionResult> {
    const key = envelope.streamKey;
    const providerSymbol = envelope.event.providerSymbol;
    const source = this.deps.snapshotSource;
    if (!source) {
      return { outcome: 'degraded', streamKey: key, instrumentId, reasonCode: 'ORDER_BOOK_DESYNC' };
    }
    let snapshot: RawOrderBookSnapshotEvent;
    try {
      snapshot = await source.fetchSnapshot(envelope.providerId, providerSymbol);
    } catch (error) {
      const reason: Rejection = {
        code: 'ORDER_BOOK_DESYNC',
        message:
          error instanceof Error
            ? `Snapshot recovery failed: ${error.message}`
            : 'Snapshot recovery failed.',
      };
      this.deps.deadLetter.add({
        at: this.deps.clock.now(),
        stage: 'order_book',
        reason,
        providerId: envelope.providerId,
        streamKey: key,
        payload: envelope.event,
      });
      this.deps.metrics.onQuarantined();
      return {
        outcome: 'degraded',
        streamKey: key,
        instrumentId,
        reason: reason.message,
        reasonCode: reason.code,
      };
    }

    this.orderBook.onSnapshot(key, snapshot);
    const synchronized = this.orderBook.stateOf(key) === 'SYNCHRONIZED';
    if (synchronized) {
      if (hadGap) this.deps.metrics.onResync();
      this.deps.state.markSynchronized(key);
      // Persist the recovered book state as a canonical snapshot record.
      const snapEnvelope: IngestionEnvelope = {
        providerId: envelope.providerId,
        streamKey: key,
        event: snapshot,
        receiveTime: envelope.receiveTime,
        ingestSequence: (this.ingestSeq += 1),
      };
      const enqueue = this.normalizeAndEnqueue(snapEnvelope, instrumentId, snapshot);
      const enqueued = await enqueue;
      // Communicate that a gap occurred even though it was handled.
      return hadGap
        ? {
            outcome: 'degraded',
            streamKey: key,
            instrumentId,
            reason: 'Recovered after gap.',
            reasonCode: 'SEQUENCE_GAP',
          }
        : enqueued;
    }
    return { outcome: 'degraded', streamKey: key, instrumentId, reasonCode: 'ORDER_BOOK_DESYNC' };
  }

  private async normalizeAndEnqueue(
    envelope: IngestionEnvelope,
    instrumentId: string,
    event: RawMarketDataEvent,
  ): Promise<IngestionResult> {
    const key = envelope.streamKey;
    const processingTime = this.deps.clock.now();
    const timestamps = this.timestamps.normalize(event, envelope.receiveTime, processingTime);
    const record = this.normalizer.normalize(envelope, instrumentId, timestamps);
    this.deps.metrics.onNormalized();

    const enqueue = this.deps.buffer.enqueue(record);
    this.deps.metrics.setBufferDepth(this.deps.buffer.depth);

    if (enqueue.accepted) {
      this.deps.state.recordIngested(key, envelope.receiveTime);
      return { outcome: 'accepted', streamKey: key, instrumentId };
    }
    if (enqueue.droppedOldest) {
      // New record accepted; the evicted oldest is a shed record under backpressure.
      this.deps.metrics.onDroppedOverflow();
      this.deps.state.recordIngested(key, envelope.receiveTime);
      return { outcome: 'accepted', streamKey: key, instrumentId };
    }
    // The new record itself was rejected by a full buffer — quarantine it.
    this.deps.metrics.onDroppedOverflow();
    this.deps.deadLetter.add({
      at: this.deps.clock.now(),
      stage: 'buffer',
      reason: { code: 'BUFFER_OVERFLOW', message: 'Ingestion buffer full; event shed.' },
      providerId: envelope.providerId,
      streamKey: key,
      payload: record,
    });
    this.deps.metrics.onQuarantined();
    return {
      outcome: 'dropped_overflow',
      streamKey: key,
      instrumentId,
      reason: 'Ingestion buffer full.',
      reasonCode: 'BUFFER_OVERFLOW',
    };
  }

  private reject(
    key: string,
    providerId: string,
    stage: 'schema' | 'symbol' | 'quality' | 'order_book',
    reason: Rejection,
    payload: unknown,
    instrumentId?: string,
  ): IngestionResult {
    this.deps.deadLetter.add({
      at: this.deps.clock.now(),
      stage,
      reason,
      providerId,
      streamKey: key,
      payload,
    });
    this.deps.metrics.onRejected(reason.code);
    this.deps.metrics.onQuarantined();
    this.deps.state.recordRejected(key, reason.code, this.deps.clock.now());
    return {
      outcome: 'rejected',
      streamKey: key,
      ...(instrumentId !== undefined ? { instrumentId } : {}),
      reason: reason.message,
      reasonCode: reason.code,
    };
  }
}
