/**
 * **ClickHouse storage configuration.** Environment-driven, never hardcoding credentials. The config
 * is loaded from an injected environment record (so it is deterministic and testable); the only place
 * that touches the ambient `process.env` is {@link configFromProcessEnv}, the composition-root helper.
 * {@link redactClickHouseConfig} masks the password so it never reaches logs or metrics.
 *
 * The `driver` selects the engine: `clickhouse` (the production default) or `memory` (isolated unit
 * tests only). Nothing here decides to fall back — the factory fails explicitly if ClickHouse is
 * selected but unreachable.
 */

export type StorageDriver = 'clickhouse' | 'memory';

export interface ClickHouseConfig {
  readonly driver: StorageDriver;
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly table: string;
  /** Per-request timeout for queries (ms). */
  readonly queryTimeoutMs: number;
  /** Per-request timeout for inserts (ms). */
  readonly insertTimeoutMs: number;
  /** Max rows sent to ClickHouse in a single insert request. */
  readonly maxBatchSize: number;
  /** Max concurrent HTTP connections the client keeps open. */
  readonly maxOpenConnections: number;
  /** Application identifier attached to requests (never a secret). */
  readonly application: string;
}

export const DEFAULT_CLICKHOUSE_CONFIG: Omit<ClickHouseConfig, 'password'> = {
  driver: 'clickhouse',
  host: 'localhost',
  port: 8123,
  secure: false,
  database: 'market_data',
  username: 'default',
  table: 'market_data_events',
  queryTimeoutMs: 30_000,
  insertTimeoutMs: 30_000,
  maxBatchSize: 100_000,
  maxOpenConnections: 10,
  application: 'market-data-storage',
};

type Env = Record<string, string | undefined>;

function str(env: Env, key: string, fallback: string): string {
  const value = env[key];
  return value !== undefined && value !== '' ? value : fallback;
}

function int(env: Env, key: string, fallback: number): number {
  const value = env[key];
  if (value === undefined || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(env: Env, key: string, fallback: boolean): boolean {
  const value = env[key];
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1' || value === 'yes';
}

function driver(env: Env): StorageDriver {
  return env.MARKET_DATA_STORAGE_DRIVER === 'memory' ? 'memory' : 'clickhouse';
}

/**
 * Load configuration from an environment record. Recognised keys (all optional; sensible dev
 * defaults, no secrets baked in):
 * `MARKET_DATA_STORAGE_DRIVER`, `CLICKHOUSE_HOST`, `CLICKHOUSE_PORT`, `CLICKHOUSE_SECURE`,
 * `CLICKHOUSE_DATABASE`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_TABLE`,
 * `CLICKHOUSE_QUERY_TIMEOUT_MS`, `CLICKHOUSE_INSERT_TIMEOUT_MS`, `CLICKHOUSE_MAX_BATCH_SIZE`,
 * `CLICKHOUSE_MAX_OPEN_CONNECTIONS`, `CLICKHOUSE_APPLICATION`.
 */
export function loadClickHouseConfig(env: Env): ClickHouseConfig {
  const secure = bool(env, 'CLICKHOUSE_SECURE', DEFAULT_CLICKHOUSE_CONFIG.secure);
  return {
    driver: driver(env),
    host: str(env, 'CLICKHOUSE_HOST', DEFAULT_CLICKHOUSE_CONFIG.host),
    port: int(env, 'CLICKHOUSE_PORT', secure ? 8443 : DEFAULT_CLICKHOUSE_CONFIG.port),
    secure,
    database: str(env, 'CLICKHOUSE_DATABASE', DEFAULT_CLICKHOUSE_CONFIG.database),
    username: str(env, 'CLICKHOUSE_USER', DEFAULT_CLICKHOUSE_CONFIG.username),
    // Never defaulted to a real value; empty means "not provided" (deployer supplies it via secrets).
    password: str(env, 'CLICKHOUSE_PASSWORD', ''),
    table: str(env, 'CLICKHOUSE_TABLE', DEFAULT_CLICKHOUSE_CONFIG.table),
    queryTimeoutMs: int(
      env,
      'CLICKHOUSE_QUERY_TIMEOUT_MS',
      DEFAULT_CLICKHOUSE_CONFIG.queryTimeoutMs,
    ),
    insertTimeoutMs: int(
      env,
      'CLICKHOUSE_INSERT_TIMEOUT_MS',
      DEFAULT_CLICKHOUSE_CONFIG.insertTimeoutMs,
    ),
    maxBatchSize: int(env, 'CLICKHOUSE_MAX_BATCH_SIZE', DEFAULT_CLICKHOUSE_CONFIG.maxBatchSize),
    maxOpenConnections: int(
      env,
      'CLICKHOUSE_MAX_OPEN_CONNECTIONS',
      DEFAULT_CLICKHOUSE_CONFIG.maxOpenConnections,
    ),
    application: str(env, 'CLICKHOUSE_APPLICATION', DEFAULT_CLICKHOUSE_CONFIG.application),
  };
}

/** The HTTP(S) URL for the ClickHouse endpoint (no credentials embedded). */
export function clickHouseUrl(config: ClickHouseConfig): string {
  return `${config.secure ? 'https' : 'http'}://${config.host}:${config.port}`;
}

/** A copy of the config safe to log/emit: the password is masked. */
export function redactClickHouseConfig(
  config: ClickHouseConfig,
): Omit<ClickHouseConfig, 'password'> & { readonly password: string } {
  return { ...config, password: config.password ? '***' : '' };
}

/**
 * Composition-root helper: read config from the live `process.env`. This is the ONLY function that
 * touches ambient environment state; everything else takes an explicit {@link ClickHouseConfig}.
 */
export function configFromProcessEnv(): ClickHouseConfig {
  return loadClickHouseConfig(process.env);
}
