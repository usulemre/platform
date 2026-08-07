# @platform/market-data-storage

The canonical **Market Data Storage layer** (Phase 10.2) — the provider-independent persistent
storage abstraction for normalized market data. It receives **only** canonical records produced by
the Market Data Ingestion Pipeline (Phase 10.1), validates them against the storage schema, writes
them idempotently into partitioned time-series storage, and serves them back to Dataset / Research /
Feature / Backtesting through canonical queries and typed repositories.

```
Provider → Market Data Ingestion Pipeline → Canonical Market Data
        → Market Data Storage → Dataset / Research / Feature / Backtesting
```

## Provider independence

The storage layer **imports no provider code** and knows nothing of Binance. It depends only on the
canonical models (`@platform/market-data-ingestion`, `@platform/market-data-sdk`). All
provider-specific transformation already happened upstream in the ingestion pipeline. A contract test
([`tests/contract.test.ts`](tests/contract.test.ts)) enforces the isolation by scanning the sources.

`MarketDataStorage` **implements the ingestion pipeline's `CanonicalMarketDataStore` port**, so it
plugs straight into the gateway:

```ts
const storage = new MarketDataStorage({ retention: { retentionDurationMs: 90 * 86_400_000 } });
const gateway = new MarketDataIngestionGateway({ store: storage, registry, clock });
// … ingest …
const trades = await storage.trades.byTimeRange('BINANCE:BTC-USDT', from, to);
const book = await storage.reconstructOrderBook('BINANCE:BTC-USDT');
```

## Storage technology

The concrete persistence engine is pluggable behind the `StorageEngine` port. This package ships a
deterministic **in-memory time-series engine** (partitions → identity-keyed entries) as the reference
implementation; a production deployment binds the same port to a durable time-series/columnar store
without changing any consumer (SE-3). No third-party database is introduced.

## Design

- **Time-series & partitioning** — records are partitioned by `(instrument, data-type, UTC date)`;
  queries prune to matching partitions and retention drops whole partitions by age.
- **Idempotency** — every record has a deterministic identity from canonical fields only (exchange
  id / sequence, or instrument+kind+event-time for stateless snapshots). Duplicate writes are skipped
  (immutable events) or upsert (candlestick bars) — never corrupting stored data.
- **Order books** — snapshots and deltas are stored separately; `reconstructOrderBook` rebuilds a book
  from a snapshot anchor plus its ordered, contiguous deltas, flagging any gap.
- **Write path** — validate → partition → bulk write with retry and **partial-batch-failure** safety;
  un-persistable records are quarantined with a reason, never dropped.
- **Retention** — configurable, explicit, observable; non-destructive by default (no
  `retentionDurationMs` → nothing expires); `plan` is a dry run before `apply` deletes.
- **Observability** — `StorageMetrics` (throughput, latency, duplicates, rejects, engine errors,
  retention drops) and `StorageHealthMonitor` (pure, deterministic health).

## Gates

`pnpm --filter @platform/market-data-storage typecheck | lint | test` — 47 unit / integration /
contract tests.
