/**
 * Cursor + keyset-pagination tests: encode/decode round-trip, strict rejection of malformed / wrong-
 * version / order-mismatched / tampered cursors, and deterministic gap-free/overlap-free pagination
 * that reproduces the full ordered result across pages.
 */
import { ManualClock } from '@platform/market-data-ingestion';
import type { NormalizedTrade } from '@platform/market-data-ingestion';
import { describe, expect, it } from 'vitest';
import {
  MarketDataStorage,
  decodeCursor,
  encodeCursor,
  QueryCursorError,
  type CursorPosition,
  type MarketDataPage,
} from '../../src/index';
import { trade, T0 } from '../helpers';

const INST = 'BINANCE:BTC-USDT';

function ts(eventTime: number) {
  return { eventTime, exchangeTime: eventTime, receiveTime: eventTime, processingTime: eventTime };
}

const POSITION: CursorPosition = {
  primaryTime: T0 + 5,
  ingestSequence: 42,
  identity: 't|BINANCE:BTC-USDT|7',
  order: 'asc',
};

describe('cursor encode/decode', () => {
  it('round-trips a position', () => {
    const decoded = decodeCursor(encodeCursor(POSITION), 'asc');
    expect(decoded).toEqual(POSITION);
  });

  it('rejects an empty cursor', () => {
    expect(() => decodeCursor('', 'asc')).toThrow(QueryCursorError);
  });

  it('rejects a non-decodable cursor', () => {
    expect(() => decodeCursor('%%%not-base64%%%', 'asc')).toThrow(QueryCursorError);
  });

  it('rejects a cursor whose order disagrees with the query', () => {
    expect(() => decodeCursor(encodeCursor(POSITION), 'desc')).toThrow(QueryCursorError);
  });

  it('rejects a tampered cursor payload', () => {
    const token = encodeCursor(POSITION);
    const tampered = `${token.slice(0, -2)}XY`;
    expect(() => decodeCursor(tampered, 'asc')).toThrow(QueryCursorError);
  });
});

describe('keyset pagination', () => {
  async function seed(count: number): Promise<MarketDataStorage> {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    const trades = Array.from({ length: count }, (_, i) =>
      trade({ instrumentId: INST, tradeId: i + 1, timestamps: ts(T0 + (i + 1) * 1000) }),
    );
    await storage.writeBatch(trades);
    return storage;
  }

  it('walks all records across pages with no overlap or gaps', async () => {
    const engine = (await seed(10)).engineQueries;
    const collected: number[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page: MarketDataPage<NormalizedTrade> = await engine.paginate<NormalizedTrade>({
        instrumentId: INST,
        kind: 'trade',
        limit: 3,
        cursor: cursor ?? undefined,
      });
      collected.push(...page.records.map((r) => r.tradeId));
      cursor = page.nextCursor;
      pages += 1;
      if (pages > 100) throw new Error('pagination did not terminate');
    } while (cursor !== null);

    expect(collected).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pages).toBe(4); // 3 + 3 + 3 + 1
  });

  it('sets hasMore/nextCursor correctly on the final page', async () => {
    const engine = (await seed(4)).engineQueries;
    const first = await engine.paginate({ instrumentId: INST, kind: 'trade', limit: 4 });
    expect(first.hasMore).toBe(false);
    expect(first.nextCursor).toBeNull();
    expect(first.pageSize).toBe(4);
  });

  it('paginates deterministically in descending order', async () => {
    const engine = (await seed(5)).engineQueries;
    const page1 = await engine.paginate<NormalizedTrade>({
      instrumentId: INST,
      kind: 'trade',
      order: 'desc',
      limit: 2,
    });
    expect(page1.records.map((r) => r.tradeId)).toEqual([5, 4]);
    const page2 = await engine.paginate<NormalizedTrade>({
      instrumentId: INST,
      kind: 'trade',
      order: 'desc',
      limit: 2,
      cursor: page1.nextCursor as string,
    });
    expect(page2.records.map((r) => r.tradeId)).toEqual([3, 2]);
  });
});
