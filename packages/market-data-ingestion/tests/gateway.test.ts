import { describe, expect, it } from 'vitest';
import { streamKey, type CanonicalMarketDataStore } from '../src/index';
import {
  INSTRUMENT_ID,
  PROVIDER,
  VENUE_SYMBOL,
  aggTrade,
  averagePrice,
  bookTicker,
  candlestick,
  makeHarness,
  markPrice,
  orderBookDelta,
  orderBookSnapshot,
  ticker,
  trade,
} from './helpers';

describe('MarketDataIngestionGateway — happy paths', () => {
  it('ingests a trade, buffers it, and stores it on flush', async () => {
    const { gateway, store } = makeHarness();
    const result = await gateway.ingest({ providerId: PROVIDER, event: trade() });
    expect(result.outcome).toBe('accepted');
    expect(result.instrumentId).toBe(INSTRUMENT_ID);
    expect(store.size).toBe(0); // still buffered
    await gateway.flush();
    expect(store.size).toBe(1);
    expect(store.byInstrument(INSTRUMENT_ID)[0]?.kind).toBe('trade');
  });

  it('ingests every canonical event type', async () => {
    const { gateway, store } = makeHarness();
    await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 1 }) });
    await gateway.ingest({ providerId: PROVIDER, event: aggTrade({ aggregateTradeId: 1 }) });
    await gateway.ingest({ providerId: PROVIDER, event: ticker() });
    await gateway.ingest({ providerId: PROVIDER, event: bookTicker({ updateId: 1 }) });
    await gateway.ingest({ providerId: PROVIDER, event: candlestick() });
    await gateway.ingest({ providerId: PROVIDER, event: markPrice() });
    await gateway.ingest({ providerId: PROVIDER, event: averagePrice() });
    await gateway.ingest({ providerId: PROVIDER, event: orderBookSnapshot() });
    await gateway.ingest({ providerId: PROVIDER, event: orderBookDelta() });
    await gateway.flush();
    // 9 events → 9 stored records (snapshot + contiguous delta both persist).
    expect(store.size).toBe(9);
    expect(store.byType('OHLCV').length).toBe(1);
    expect(store.byType('MARK_PRICES').length).toBe(1);
  });

  it('stores repeated candlestick updates for the same open time (not de-duplicated)', async () => {
    const { gateway, store } = makeHarness();
    await gateway.ingest({
      providerId: PROVIDER,
      event: candlestick({ closed: false, close: 49_950 }),
    });
    await gateway.ingest({
      providerId: PROVIDER,
      event: candlestick({ closed: false, close: 50_000 }),
    });
    await gateway.ingest({
      providerId: PROVIDER,
      event: candlestick({ closed: true, close: 50_050 }),
    });
    await gateway.flush();
    expect(store.byType('OHLCV').length).toBe(3);
  });
});

describe('MarketDataIngestionGateway — sequence handling', () => {
  it('drops a duplicate trade', async () => {
    const { gateway, store } = makeHarness();
    await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 5 }) });
    const dup = await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 5 }) });
    expect(dup.outcome).toBe('duplicate');
    await gateway.flush();
    expect(store.size).toBe(1);
    expect(gateway.metricsSnapshot().duplicates).toBe(1);
  });

  it('drops an out-of-order trade', async () => {
    const { gateway } = makeHarness();
    await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 10 }) });
    const ooo = await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 7 }) });
    expect(ooo.outcome).toBe('out_of_order');
    expect(gateway.metricsSnapshot().outOfOrder).toBe(1);
  });

  it('records a gap but still ingests monotonic trade streams', async () => {
    const { gateway, store } = makeHarness();
    await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 1 }) });
    await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 50 }) });
    await gateway.flush();
    expect(store.size).toBe(2);
    expect(gateway.metricsSnapshot().gaps).toBe(1);
  });
});

describe('MarketDataIngestionGateway — rejection & quarantine', () => {
  it('quarantines a malformed event', async () => {
    const { gateway } = makeHarness();
    const result = await gateway.ingest({
      providerId: PROVIDER,
      event: trade({ price: Number.NaN }),
    });
    expect(result.outcome).toBe('rejected');
    expect(gateway.deadLetters()[0]?.stage).toBe('schema');
    expect(gateway.metricsSnapshot().quarantined).toBe(1);
  });

  it('quarantines an unknown symbol', async () => {
    const { gateway } = makeHarness();
    const result = await gateway.ingest({
      providerId: PROVIDER,
      event: trade({ providerSymbol: 'DOGEUSDT' }),
    });
    expect(result.outcome).toBe('rejected');
    expect(result.reasonCode).toBe('SYMBOL_UNKNOWN');
    expect(gateway.deadLetters()[0]?.stage).toBe('symbol');
  });

  it('quarantines an invalid price', async () => {
    const { gateway } = makeHarness();
    const result = await gateway.ingest({ providerId: PROVIDER, event: trade({ price: -1 }) });
    expect(result.outcome).toBe('rejected');
    expect(result.reasonCode).toBe('PRICE_INVALID');
    expect(gateway.deadLetters()[0]?.stage).toBe('quality');
  });

  it('quarantines an invalid quantity', async () => {
    const { gateway } = makeHarness();
    const result = await gateway.ingest({ providerId: PROVIDER, event: trade({ quantity: 0 }) });
    expect(result.reasonCode).toBe('QUANTITY_INVALID');
  });

  it('quarantines an invalid timestamp', async () => {
    const { gateway } = makeHarness();
    const result = await gateway.ingest({
      providerId: PROVIDER,
      event: trade({ eventTime: 1, tradeTime: 1 }),
    });
    expect(result.reasonCode).toBe('TIMESTAMP_INVALID');
  });
});

describe('MarketDataIngestionGateway — backpressure & overflow', () => {
  it('sheds and quarantines under a REJECT-policy overflow', async () => {
    const { gateway } = makeHarness({ buffer: { capacity: 1, overflow: 'REJECT' } });
    const first = await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 1 }) });
    const second = await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 2 }) });
    expect(first.outcome).toBe('accepted');
    expect(second.outcome).toBe('dropped_overflow');
    expect(gateway.metricsSnapshot().droppedOverflow).toBe(1);
    expect(gateway.deadLetters().some((e) => e.stage === 'buffer')).toBe(true);
  });

  it('counts an eviction under DROP_OLDEST but still admits the new event', async () => {
    const { gateway } = makeHarness({ buffer: { capacity: 1, overflow: 'DROP_OLDEST' } });
    await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 1 }) });
    const second = await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 2 }) });
    expect(second.outcome).toBe('accepted');
    expect(gateway.metricsSnapshot().droppedOverflow).toBe(1);
  });
});

describe('MarketDataIngestionGateway — store failure & health', () => {
  it('dead-letters records when the store permanently fails', async () => {
    const broken: CanonicalMarketDataStore = {
      async append() {
        throw new Error('disk full');
      },
    };
    const { gateway } = makeHarness({ store: broken, batch: { maxAttempts: 2, maxBatchSize: 10 } });
    await gateway.ingest({ providerId: PROVIDER, event: trade() });
    const outcomes = await gateway.flush();
    expect(outcomes[0]?.deadLettered).toBe(true);
    expect(gateway.metricsSnapshot().storeFailures).toBe(2);
    expect(gateway.deadLetters().some((e) => e.stage === 'store')).toBe(true);
  });

  it('reports OFFLINE health before any event and HEALTHY after a clean ingest', async () => {
    const { gateway, clock } = makeHarness();
    expect(gateway.health().level).toBe('OFFLINE');
    await gateway.ingest({ providerId: PROVIDER, event: trade() });
    await gateway.flush();
    expect(gateway.health(clock.now()).level).toBe('HEALTHY');
  });

  it('tracks per-stream state', async () => {
    const { gateway } = makeHarness();
    const key = streamKey(PROVIDER, trade());
    await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 1 }) });
    await gateway.ingest({ providerId: PROVIDER, event: trade({ tradeId: 1 }) });
    const state = gateway.streamState(key);
    expect(state?.ingested).toBe(1);
    expect(state?.duplicates).toBe(1);
    expect(state?.streamKey).toBe(`${PROVIDER}:trade:${VENUE_SYMBOL}`);
  });
});
