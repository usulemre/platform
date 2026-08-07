import { describe, expect, it } from 'vitest';
import {
  BatchProcessor,
  DeadLetterQueue,
  IngestionBuffer,
  IngestionMetrics,
  InMemoryMarketDataStore,
  ManualClock,
  type CanonicalMarketDataStore,
  type NormalizedMarketDataRecord,
} from '../src/index';
import { INSTRUMENT_ID, PROVIDER, T0, VENUE_SYMBOL } from './helpers';

function record(id: number): NormalizedMarketDataRecord {
  return {
    kind: 'trade',
    instrumentId: INSTRUMENT_ID,
    marketDataType: 'TRADES',
    timestamps: { receiveTime: T0, processingTime: T0 },
    provenance: {
      providerId: PROVIDER,
      streamKey: 'k',
      providerSymbol: VENUE_SYMBOL,
      sequence: id,
      ingestSequence: id,
    },
    tradeId: id,
    price: 1,
    quantity: 1,
    buyerIsMaker: false,
  };
}

describe('IngestionBuffer', () => {
  it('accepts up to capacity and reports depth', () => {
    const buf = new IngestionBuffer<number>({ capacity: 2, overflow: 'REJECT' });
    expect(buf.enqueue(1)).toEqual({ accepted: true, depth: 1 });
    expect(buf.enqueue(2)).toEqual({ accepted: true, depth: 2 });
    expect(buf.isFull).toBe(true);
  });

  it('REJECT policy refuses new items when full', () => {
    const buf = new IngestionBuffer<number>({ capacity: 1, overflow: 'REJECT' });
    buf.enqueue(1);
    const result = buf.enqueue(2);
    expect(result.accepted).toBe(false);
    expect(buf.dequeue(10)).toEqual([1]);
  });

  it('DROP_OLDEST evicts the head to admit the new item', () => {
    const buf = new IngestionBuffer<number>({ capacity: 2, overflow: 'DROP_OLDEST' });
    buf.enqueue(1);
    buf.enqueue(2);
    const result = buf.enqueue(3);
    expect(result.accepted).toBe(false);
    if (!result.accepted) expect(result.droppedOldest).toBe(true);
    expect(buf.dequeue(10)).toEqual([2, 3]);
  });

  it('reports backpressure past the high-watermark', () => {
    const buf = new IngestionBuffer<number>({
      capacity: 10,
      overflow: 'REJECT',
      highWatermark: 0.5,
    });
    for (let i = 0; i < 5; i += 1) buf.enqueue(i);
    expect(buf.isUnderPressure()).toBe(true);
  });
});

describe('DeadLetterQueue', () => {
  it('quarantines with a reason and bounds capacity', () => {
    const dlq = new DeadLetterQueue({ capacity: 2 });
    dlq.add({
      at: T0,
      stage: 'schema',
      reason: { code: 'SCHEMA_INVALID', message: 'x' },
      payload: 1,
    });
    dlq.add({
      at: T0,
      stage: 'schema',
      reason: { code: 'SCHEMA_INVALID', message: 'y' },
      payload: 2,
    });
    dlq.add({
      at: T0,
      stage: 'schema',
      reason: { code: 'SCHEMA_INVALID', message: 'z' },
      payload: 3,
    });
    expect(dlq.size).toBe(2);
    expect(dlq.evictedCount).toBe(1);
    expect(dlq.list()[0]?.reason.message).toBe('y');
  });
});

describe('BatchProcessor', () => {
  function deps(store: CanonicalMarketDataStore, maxAttempts = 3) {
    const buffer = new IngestionBuffer<NormalizedMarketDataRecord>({ capacity: 100 });
    const deadLetter = new DeadLetterQueue();
    const metrics = new IngestionMetrics();
    const clock = new ManualClock(T0);
    const processor = new BatchProcessor({
      buffer,
      store,
      deadLetter,
      metrics,
      clock,
      config: { maxBatchSize: 10, maxAttempts },
    });
    return { buffer, deadLetter, metrics, processor };
  }

  it('writes a batch to the store and drains the buffer', async () => {
    const store = new InMemoryMarketDataStore();
    const { buffer, processor, metrics } = deps(store);
    buffer.enqueue(record(1));
    buffer.enqueue(record(2));
    const outcomes = await processor.drainAll();
    expect(outcomes[0]?.written).toBe(true);
    expect(store.size).toBe(2);
    expect(metrics.snapshot().stored).toBe(2);
    expect(buffer.isEmpty).toBe(true);
  });

  it('retries a transient store failure then succeeds', async () => {
    let calls = 0;
    const flaky: CanonicalMarketDataStore = {
      async append() {
        calls += 1;
        if (calls < 2) throw new Error('transient');
      },
    };
    const { buffer, processor, metrics } = deps(flaky);
    buffer.enqueue(record(1));
    const outcome = await processor.drainOnce();
    expect(outcome?.written).toBe(true);
    expect(outcome?.attempts).toBe(2);
    expect(metrics.snapshot().storeFailures).toBe(1);
  });

  it('dead-letters a batch after exhausting retries', async () => {
    const broken: CanonicalMarketDataStore = {
      async append() {
        throw new Error('permanent');
      },
    };
    const { buffer, processor, deadLetter, metrics } = deps(broken, 2);
    buffer.enqueue(record(1));
    const outcome = await processor.drainOnce();
    expect(outcome?.written).toBe(false);
    expect(outcome?.deadLettered).toBe(true);
    expect(deadLetter.size).toBe(1);
    expect(deadLetter.list()[0]?.reason.code).toBe('STORE_FAILURE');
    expect(metrics.snapshot().quarantined).toBe(1);
  });
});
