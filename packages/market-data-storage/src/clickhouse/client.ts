/**
 * The **ClickHouse client seam.** `ClickHouseClient` is a thin, canonical port over the operations the
 * storage engine needs (command / insert / query / ping / close). `NodeClickHouseClient` is the real
 * implementation, backed by the official `@clickhouse/client` talking HTTP to a real ClickHouse
 * server — no simulation, no fake adapter. Per-request timeouts are enforced with `AbortSignal`, and
 * every raw failure is translated into a canonical {@link StorageEngineError} so ClickHouse internals
 * never leak through the platform contracts.
 */
import { createClient } from '@clickhouse/client';
import { mapClickHouseError, type MappedError } from './errors';
import { clickHouseUrl, type ClickHouseConfig } from './config';

/** The operations the storage engine performs against ClickHouse. */
export interface ClickHouseClient {
  /** Execute a DDL/DML statement with no result set (CREATE/ALTER/DROP). */
  command(sql: string): Promise<void>;
  /** Bulk-insert rows into a table using an efficient row format (one request per call). */
  insert(table: string, rows: readonly unknown[]): Promise<void>;
  /** Run a query and return the rows, with optional parameter binding. */
  query<T>(sql: string, params?: Record<string, unknown>): Promise<T[]>;
  /** Verify connectivity to the server. Returns true only if the server responds healthy. */
  ping(): Promise<boolean>;
  /** Release all connections. */
  close(): Promise<void>;
}

/** Thrown-error helper so callers can inspect retryability. */
export function isRetryable(error: unknown): boolean {
  return (
    Boolean(error) &&
    typeof error === 'object' &&
    (error as { retryable?: boolean }).retryable === true
  );
}

type Vendor = ReturnType<typeof createClient>;

export class NodeClickHouseClient implements ClickHouseClient {
  private readonly client: Vendor;

  constructor(private readonly config: ClickHouseConfig) {
    this.client = createClient({
      url: clickHouseUrl(config),
      username: config.username,
      password: config.password,
      database: config.database,
      request_timeout: Math.max(config.queryTimeoutMs, config.insertTimeoutMs),
      max_open_connections: config.maxOpenConnections,
      application: config.application,
      clickhouse_settings: {
        // Wait for the insert to be written and quorum-acknowledged before returning.
        async_insert: 0,
      },
    });
  }

  async command(sql: string): Promise<void> {
    try {
      await this.client.command({
        query: sql,
        abort_signal: AbortSignal.timeout(this.config.queryTimeoutMs),
      });
    } catch (raw) {
      throw this.translate(raw, 'command');
    }
  }

  async insert(table: string, rows: readonly unknown[]): Promise<void> {
    try {
      await this.client.insert({
        table,
        values: rows,
        format: 'JSONEachRow',
        abort_signal: AbortSignal.timeout(this.config.insertTimeoutMs),
      });
    } catch (raw) {
      throw this.translate(raw, 'insert');
    }
  }

  async query<T>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    try {
      const result = await this.client.query({
        query: sql,
        query_params: params,
        format: 'JSONEachRow',
        abort_signal: AbortSignal.timeout(this.config.queryTimeoutMs),
      });
      return await result.json<T>();
    } catch (raw) {
      throw this.translate(raw, 'query');
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result.success === true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  /** Map a raw failure to a canonical error, attaching the retryability verdict for the caller. */
  private translate(raw: unknown, operation: string): StorageEngineErrorWithRetry {
    const mapped: MappedError = mapClickHouseError(raw, operation);
    return Object.assign(mapped.error, { retryable: mapped.retryable });
  }
}

/** A canonical storage error carrying its retryability verdict. */
export type StorageEngineErrorWithRetry = Error & {
  readonly code: string;
  readonly retryable: boolean;
};
