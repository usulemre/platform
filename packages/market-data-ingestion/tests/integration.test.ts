import { describe, expect, it } from 'vitest';
import {
  InMemoryInstrumentRegistry,
  InMemoryMarketDataStore,
  ManualClock,
  MarketDataIngestionGateway,
  streamKey,
  type IngestionResult,
  type MarketDataConsumer,
  type OrderBookSnapshotSource,
  type ProviderMarketDataSource,
  type RawMarketDataEvent,
  type RawOrderBookSnapshotEvent,
} from '../src/index';
import {
  INSTRUMENT_ID,
  PROVIDER,
  T0,
  makeRegistry,
  orderBookDelta,
  orderBookSnapshot,
  trade,
} from './helpers';

/** A minimal provider adapter that satisfies the provider-neutral source contract. */
class MockProvider implements ProviderMarketDataSource {
  readonly providerId = PROVIDER;
  private consumer: MarketDataConsumer | undefined;
  started = false;

  start(consumer: MarketDataConsumer): void {
    this.consumer = consumer;
    this.started = true;
  }

  stop(): void {
    this.started = false;
  }

  async emit(event: RawMarketDataEvent): Promise<IngestionResult> {
    if (!this.consumer) throw new Error('provider not started');
    return this.consumer.ingest({ providerId: this.providerId, event });
  }
}

/** A controllable, provider-neutral snapshot source for order-book recovery. */
class MockSnapshotSource implements OrderBookSnapshotSource {
  calls = 0;
  constructor(private readonly queue: RawOrderBookSnapshotEvent[]) {}
  async fetchSnapshot(): Promise<RawOrderBookSnapshotEvent> {
    this.calls += 1;
    const next = this.queue.shift();
    if (!next) throw new Error('no snapshot available');
    return next;
  }
}

describe('provider integration through the neutral contract', () => {
  it('connects a provider source and ingests its events', async () => {
    const clock = new ManualClock(T0);
    const store = new InMemoryMarketDataStore();
    const gateway = new MarketDataIngestionGateway({ store, registry: makeRegistry(), clock });
    const provider = new MockProvider();
    await gateway.connect(provider);
    expect(provider.started).toBe(true);

    const result = await provider.emit(trade({ tradeId: 1 }));
    expect(result.outcome).toBe('accepted');
    await gateway.flush();
    expect(store.byInstrument(INSTRUMENT_ID).length).toBe(1);

    await gateway.disconnect(PROVIDER);
    expect(provider.started).toBe(false);
  });

  it('recovers a desynced order book by fetching a fresh snapshot', async () => {
    const clock = new ManualClock(T0);
    const store = new InMemoryMarketDataStore();
    const snapshotSource = new MockSnapshotSource([
      // A fresh snapshot that subsumes the gap delta (lastUpdateId ≥ the buffered delta's final id).
      orderBookSnapshot({ lastUpdateId: 210 }),
    ]);
    const gateway = new MarketDataIngestionGateway({
      store,
      registry: makeRegistry(),
      clock,
      snapshotSource,
    });
    const key = streamKey(PROVIDER, orderBookSnapshot());

    // Initial snapshot + contiguous delta → synchronized.
    await gateway.ingest({ providerId: PROVIDER, event: orderBookSnapshot({ lastUpdateId: 100 }) });
    await gateway.ingest({
      providerId: PROVIDER,
      event: orderBookDelta({ firstUpdateId: 101, finalUpdateId: 105 }),
    });
    expect(gateway.orderBookState(key)).toBe('SYNCHRONIZED');

    // A gap delta → degrade → recover via snapshot source.
    const gapResult = await gateway.ingest({
      providerId: PROVIDER,
      event: orderBookDelta({ firstUpdateId: 200, finalUpdateId: 205 }),
    });
    expect(gapResult.outcome).toBe('degraded');
    expect(snapshotSource.calls).toBe(1);
    expect(gateway.orderBookState(key)).toBe('SYNCHRONIZED');
    expect(gateway.metricsSnapshot().resyncs).toBe(1);
    expect(gateway.metricsSnapshot().gaps).toBe(1);

    await gateway.flush();
    // The recovered book state was persisted as a canonical snapshot record.
    expect(store.byType('ORDER_BOOKS').some((r) => r.kind === 'orderBookSnapshot')).toBe(true);
  });

  it('stays degraded when no snapshot source can recover the book', async () => {
    const clock = new ManualClock(T0);
    const store = new InMemoryMarketDataStore();
    const gateway = new MarketDataIngestionGateway({ store, registry: makeRegistry(), clock });
    const key = streamKey(PROVIDER, orderBookSnapshot());
    await gateway.ingest({ providerId: PROVIDER, event: orderBookSnapshot({ lastUpdateId: 100 }) });
    const result = await gateway.ingest({
      providerId: PROVIDER,
      event: orderBookDelta({ firstUpdateId: 500, finalUpdateId: 505 }),
    });
    expect(result.outcome).toBe('degraded');
    expect(gateway.orderBookState(key)).toBe('DEGRADED');
  });
});

describe('high-volume and concurrent ingestion', () => {
  it('ingests a high volume of trades deterministically', async () => {
    const clock = new ManualClock(T0);
    const store = new InMemoryMarketDataStore();
    const gateway = new MarketDataIngestionGateway({
      store,
      registry: makeRegistry(),
      clock,
      buffer: { capacity: 20_000 },
      batch: { maxBatchSize: 1000, maxAttempts: 1 },
    });
    const N = 10_000;
    for (let i = 1; i <= N; i += 1) {
      await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: i }) });
    }
    await gateway.flush();
    expect(store.size).toBe(N);
    const metrics = gateway.metricsSnapshot();
    expect(metrics.received).toBe(N);
    expect(metrics.stored).toBe(N);
    expect(metrics.duplicates).toBe(0);
    expect(metrics.outOfOrder).toBe(0);
  });

  it('handles concurrent ingestion across independent symbols', async () => {
    const clock = new ManualClock(T0);
    const store = new InMemoryMarketDataStore();
    const registry = new InMemoryInstrumentRegistry()
      .register(PROVIDER, 'BTCUSDT', {
        instrumentId: 'BINANCE:BTC-USDT',
        base: 'BTC',
        quote: 'USDT',
        active: true,
      })
      .register(PROVIDER, 'ETHUSDT', {
        instrumentId: 'BINANCE:ETH-USDT',
        base: 'ETH',
        quote: 'USDT',
        active: true,
      });
    const gateway = new MarketDataIngestionGateway({ store, registry, clock });

    const events: RawMarketDataEvent[] = [];
    for (let i = 1; i <= 100; i += 1) {
      events.push(trade({ providerSymbol: 'BTCUSDT', tradeId: i }));
      events.push(trade({ providerSymbol: 'ETHUSDT', tradeId: i, price: 3000 }));
    }
    const results = await Promise.all(
      events.map((event) => gateway.ingest({ providerId: PROVIDER, event })),
    );
    expect(results.every((r) => r.outcome === 'accepted')).toBe(true);
    await gateway.flush();
    expect(store.byInstrument('BINANCE:BTC-USDT').length).toBe(100);
    expect(store.byInstrument('BINANCE:ETH-USDT').length).toBe(100);
  });

  it('remains stable and observable under buffer overflow', async () => {
    const clock = new ManualClock(T0);
    const store = new InMemoryMarketDataStore();
    const gateway = new MarketDataIngestionGateway({
      store,
      registry: makeRegistry(),
      clock,
      buffer: { capacity: 10, overflow: 'REJECT' },
    });
    let overflowed = 0;
    for (let i = 1; i <= 50; i += 1) {
      const result = await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: i }) });
      if (result.outcome === 'dropped_overflow') overflowed += 1;
    }
    expect(overflowed).toBe(40);
    expect(gateway.metricsSnapshot().droppedOverflow).toBe(40);
    // Nothing silently lost: every shed event is quarantined with a reason.
    expect(gateway.deadLetters().filter((e) => e.stage === 'buffer').length).toBe(40);
  });
});
