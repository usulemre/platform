import { StorageEngineError } from '../../src/index';
import {
  buildDistinctPartitionsQuery,
  buildDropPartitionStatement,
  buildPartitionCountQuery,
  buildReadQuery,
  chQuote,
  clickHouseUrl,
  eventTableDdl,
  fromRow,
  loadClickHouseConfig,
  mapClickHouseError,
  migrations,
  redactClickHouseConfig,
  toRow,
} from '../../src/index';
import type { StoredEntry } from '../../src/index';
import type { NormalizedMarketDataRecord } from '@platform/market-data-ingestion';
import { describe, expect, it } from 'vitest';
import { INSTRUMENT, T0, orderBookSnapshot, trade } from '../helpers';
import {
  computePartition,
  partitionKeyString,
  primaryTimestamp,
  recordIdentity,
} from '../../src/index';

function entry(record: NormalizedMarketDataRecord = trade()): StoredEntry {
  return {
    identity: recordIdentity(record),
    partition: partitionKeyString(computePartition(record)),
    primaryTime: primaryTimestamp(record.timestamps),
    upsert: record.kind === 'candlestick',
    record,
    storedAt: T0,
  };
}

describe('ClickHouse config', () => {
  it('applies defaults and selects clickhouse by default', () => {
    const cfg = loadClickHouseConfig({});
    expect(cfg.driver).toBe('clickhouse');
    expect(cfg.host).toBe('localhost');
    expect(cfg.port).toBe(8123);
    expect(cfg.database).toBe('market_data');
    expect(cfg.password).toBe('');
    expect(clickHouseUrl(cfg)).toBe('http://localhost:8123');
  });

  it('reads overrides from the environment record', () => {
    const cfg = loadClickHouseConfig({
      MARKET_DATA_STORAGE_DRIVER: 'memory',
      CLICKHOUSE_HOST: 'ch.internal',
      CLICKHOUSE_SECURE: 'true',
      CLICKHOUSE_USER: 'svc',
      CLICKHOUSE_PASSWORD: 'secret',
      CLICKHOUSE_MAX_BATCH_SIZE: '5000',
    });
    expect(cfg.driver).toBe('memory');
    expect(cfg.secure).toBe(true);
    expect(cfg.port).toBe(8443); // secure default
    expect(clickHouseUrl(cfg)).toBe('https://ch.internal:8443');
    expect(cfg.maxBatchSize).toBe(5000);
  });

  it('never exposes the password when redacted', () => {
    const cfg = loadClickHouseConfig({ CLICKHOUSE_PASSWORD: 'topsecret' });
    const redacted = redactClickHouseConfig(cfg);
    expect(redacted.password).toBe('***');
    expect(JSON.stringify(redacted)).not.toContain('topsecret');
  });
});

describe('serialization', () => {
  it('round-trips a canonical record through a row without loss', () => {
    const original = entry(trade({ tradeId: 42 }));
    const row = toRow(original);
    expect(row.instrument_id).toBe(INSTRUMENT);
    expect(row.identity).toBe('t|BINANCE:BTC-USDT|42');
    expect(row.ver).toBe(row.stored_at);
    // Simulate ClickHouse returning Int64 columns as strings.
    const back = fromRow({
      instrument_id: row.instrument_id,
      market_data_type: row.market_data_type,
      partition_date: row.partition_date,
      primary_time: String(row.primary_time),
      stored_at: String(row.stored_at),
      identity: row.identity,
      record: row.record,
    });
    expect(back.record).toEqual(original.record);
    expect(back.primaryTime).toBe(original.primaryTime);
    expect(back.partition).toBe(original.partition);
  });

  it('preserves order-book level arrays through the JSON record column', () => {
    const row = toRow(entry(orderBookSnapshot({ lastUpdateId: 7 })));
    const back = fromRow({ ...row, primary_time: row.primary_time, stored_at: row.stored_at });
    expect(back.record.kind).toBe('orderBookSnapshot');
    if (back.record.kind === 'orderBookSnapshot') {
      expect(back.record.bids.length).toBe(2);
    }
  });

  it('escapes single quotes for unbound literals', () => {
    expect(chQuote("BINANCE:O'HARE")).toBe("'BINANCE:O\\'HARE'");
  });
});

describe('query builder', () => {
  it('reads all partitions with FINAL when none are specified', () => {
    const q = buildReadQuery('t', []);
    expect(q.sql).toContain('FROM t FINAL');
    expect(q.sql).not.toContain('WHERE');
    expect(q.params).toEqual({});
  });

  it('binds the partition predicate as string-array parameters (injection-safe)', () => {
    const q = buildReadQuery('t', [
      'BINANCE:BTC-USDT|TRADES|2023-11-14',
      'BINANCE:ETH-USDT|TRADES|2023-11-15',
    ]);
    expect(q.sql).toContain('instrument_id IN {insts: Array(String)}');
    expect(q.sql).toContain('market_data_type IN {types: Array(String)}');
    expect(q.sql).toContain('partition_date IN {dates: Array(String)}');
    expect(q.params.insts).toEqual(['BINANCE:BTC-USDT', 'BINANCE:ETH-USDT']);
    expect(q.params.types).toEqual(['TRADES']);
    expect(q.params.dates).toEqual(['2023-11-14', '2023-11-15']);
  });

  it('builds a bounded partition-count query', () => {
    const q = buildPartitionCountQuery('t', 'BINANCE:BTC-USDT|TRADES|2023-11-14');
    expect(q.params).toEqual({ i: 'BINANCE:BTC-USDT', t: 'TRADES', d: '2023-11-14' });
  });

  it('builds a DROP PARTITION statement with escaped literals', () => {
    const stmt = buildDropPartitionStatement('t', 'BINANCE:BTC-USDT|TRADES|2023-11-14');
    expect(stmt).toBe("ALTER TABLE t DROP PARTITION ('BINANCE:BTC-USDT', 'TRADES', '2023-11-14')");
  });

  it('lists distinct partitions', () => {
    expect(buildDistinctPartitionsQuery('t')).toContain('SELECT DISTINCT');
  });
});

describe('schema & migrations', () => {
  it('event DDL uses ReplacingMergeTree, canonical partition and order keys', () => {
    const ddl = eventTableDdl('market_data_events');
    expect(ddl).toContain('ENGINE = ReplacingMergeTree(ver)');
    expect(ddl).toContain('PARTITION BY (instrument_id, market_data_type, partition_date)');
    expect(ddl).toContain('ORDER BY (instrument_id, market_data_type, primary_time, identity)');
  });

  it('has a versioned migration set', () => {
    const list = migrations('market_data_events');
    expect(list[0]?.version).toBe(1);
    expect(list.map((m) => m.version)).toEqual(
      [...list.map((m) => m.version)].sort((a, b) => a - b),
    );
  });
});

describe('error mapping', () => {
  it('classifies network errors as retryable ENGINE_UNAVAILABLE', () => {
    const m = mapClickHouseError(
      Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      'insert',
    );
    expect(m.error).toBeInstanceOf(StorageEngineError);
    expect(m.error.code).toBe('ENGINE_UNAVAILABLE');
    expect(m.retryable).toBe(true);
  });

  it('classifies timeouts as retryable', () => {
    const m = mapClickHouseError(
      Object.assign(new Error('request timed out'), { name: 'TimeoutError' }),
      'query',
    );
    expect(m.retryable).toBe(true);
  });

  it('classifies auth failures as non-retryable', () => {
    const m = mapClickHouseError(Object.assign(new Error('auth'), { code: '516' }), 'query');
    expect(m.error.code).toBe('ENGINE_UNAVAILABLE');
    expect(m.retryable).toBe(false);
  });

  it('classifies schema errors as non-retryable SCHEMA_INCOMPATIBLE', () => {
    const m = mapClickHouseError(
      Object.assign(new Error('unknown table'), { code: '60' }),
      'insert',
    );
    expect(m.error.code).toBe('SCHEMA_INCOMPATIBLE');
    expect(m.retryable).toBe(false);
  });
});
