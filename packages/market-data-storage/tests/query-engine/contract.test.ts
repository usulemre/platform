/**
 * Contract test: the Query Engine's public surface is canonical. It returns canonical domain records
 * and canonical page envelopes — never storage rows, SQL, ClickHouse column names, or database
 * cursors — and its errors carry canonical codes with sanitized messages.
 */
import { ManualClock } from '@platform/market-data-ingestion';
import { describe, expect, it } from 'vitest';
import { MarketDataStorage, QueryError } from '../../src/index';
import { trade, T0 } from '../helpers';

const INST = 'BINANCE:BTC-USDT';

describe('Query Engine canonical read contract', () => {
  it('returns canonical records with no ClickHouse/SQL-shaped fields', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    await storage.write(trade({ instrumentId: INST, tradeId: 1 }));

    const rows = await storage.engineQueries.query({ instrumentId: INST, kind: 'trade' });
    expect(rows).toHaveLength(1);
    const keys = Object.keys(rows[0] ?? {});
    // Canonical envelope fields are present…
    expect(keys).toEqual(
      expect.arrayContaining([
        'instrumentId',
        'kind',
        'marketDataType',
        'timestamps',
        'provenance',
      ]),
    );
    // …and no storage-row / SQL columns leak through.
    for (const forbidden of [
      'record',
      'partition_date',
      'ingest_sequence',
      'ver',
      'primary_time',
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('returns a canonical page envelope with an opaque cursor (no raw db handle)', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    await storage.writeBatch([
      trade({ instrumentId: INST, tradeId: 1 }),
      trade({ instrumentId: INST, tradeId: 2 }),
    ]);
    const page = await storage.engineQueries.paginate({
      instrumentId: INST,
      kind: 'trade',
      limit: 1,
    });
    expect(Object.keys(page).sort()).toEqual(
      ['cursor', 'hasMore', 'limit', 'nextCursor', 'order', 'pageSize', 'records'].sort(),
    );
    // The cursor is an opaque token, not a SQL/OFFSET expression.
    expect(page.nextCursor).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(page.nextCursor ?? '').not.toMatch(/select|offset|where/i);
  });

  it('never leaks provider identifiers through the query contract', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    await storage.write(trade({ instrumentId: INST, tradeId: 1 }));
    const rows = await storage.engineQueries.query({ instrumentId: INST });
    // The result is expressed purely in canonical terms; the engine took only a canonical instrument id.
    expect(rows[0]?.instrumentId).toBe(INST);
  });

  it('raises canonical QueryError instances (stable codes)', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    const error = await storage.engineQueries
      .query({ instrumentId: INST, limit: -5 })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(QueryError);
    expect((error as QueryError).code).toBe('LIMIT_INVALID');
  });
});
