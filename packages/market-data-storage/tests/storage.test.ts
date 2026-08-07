import {
  InMemoryInstrumentRegistry,
  ManualClock,
  MarketDataIngestionGateway,
  type RawTradeEvent,
} from '@platform/market-data-ingestion';
import { describe, expect, it } from 'vitest';
import { MarketDataStorage, type EngineWriteReport, type StorageEngine } from '../src/index';
import { INSTRUMENT, PROVIDER, T0, VENUE_SYMBOL, trade } from './helpers';

describe('MarketDataStorage façade', () => {
  it('implements the ingestion CanonicalMarketDataStore port end-to-end', async () => {
    const clock = new ManualClock(T0);
    const storage = new MarketDataStorage({ clock });
    const registry = new InMemoryInstrumentRegistry().register(PROVIDER, VENUE_SYMBOL, {
      instrumentId: INSTRUMENT,
      base: 'BTC',
      quote: 'USDT',
      active: true,
    });
    // The whole canonical path: Provider adapter → Ingestion → Canonical Storage.
    const gateway = new MarketDataIngestionGateway({ store: storage, registry, clock });

    const raw: RawTradeEvent = {
      kind: 'trade',
      providerSymbol: VENUE_SYMBOL,
      tradeId: 1,
      price: 50_000,
      quantity: 0.5,
      buyerIsMaker: false,
      tradeTime: T0,
      eventTime: T0,
    };
    await gateway.ingest({ providerId: PROVIDER, event: raw });
    await gateway.flush();

    const stored = await storage.trades.byInstrument(INSTRUMENT);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.instrumentId).toBe(INSTRUMENT);
    expect(storage.size()).toBe(1);
  });

  it('reports OFFLINE health before any write and HEALTHY after a clean write', async () => {
    const clock = new ManualClock(T0);
    const storage = new MarketDataStorage({ clock });
    expect(storage.health().level).toBe('OFFLINE');
    await storage.write(trade());
    expect(storage.health(clock.now()).level).toBe('HEALTHY');
    expect(storage.metricsSnapshot().persisted).toBe(1);
  });

  it('surfaces a total engine failure through the append port so the pipeline can retry', async () => {
    const broken: StorageEngine = {
      async write(): Promise<EngineWriteReport> {
        throw new Error('engine down');
      },
      async read() {
        return [];
      },
      listPartitions() {
        return [];
      },
      async dropPartition() {
        return 0;
      },
      count() {
        return 0;
      },
    };
    const storage = new MarketDataStorage({
      engine: broken,
      clock: new ManualClock(T0),
      writer: { maxAttempts: 1 },
    });
    await expect(storage.append([trade()])).rejects.toThrow(/failed to persist/i);
    expect(storage.deadLetters()).toHaveLength(1);
  });

  it('does not throw from append when records are merely rejected by validation', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    // An invalid record is quarantined, not a persistence failure — append resolves.
    await expect(storage.append([trade({ price: -1 })])).resolves.toBeUndefined();
    expect(storage.deadLetters()).toHaveLength(1);
  });

  it('exposes partitions for operational visibility', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    await storage.write(trade());
    expect(storage.partitions()).toEqual([
      `${INSTRUMENT}|TRADES|${new Date(T0).toISOString().slice(0, 10)}`,
    ]);
  });
});
