# @platform/market-data-ingestion

The canonical **Market Data Ingestion Pipeline** (Phase 10.1) — the provider-independent layer that
receives canonical market-data events from provider adapters (Binance today, any venue tomorrow),
validates and normalizes them, keeps order books synchronized, detects duplicates/gaps/out-of-order
events, buffers and batches under backpressure, quarantines what it cannot accept, and delivers
immutable, provenance-bearing canonical records into the platform's canonical market-data store for
Dataset / Research / Feature / Backtesting to consume.

## Provider independence (the acceptance criterion)

The ingestion **core imports no provider SDK, DTO, client, or enum**. Providers integrate only
through the neutral contracts in [`src/provider/provider-source.ts`](src/provider/provider-source.ts):

- `MarketDataConsumer` — the sink the gateway exposes (`ingest`).
- `ProviderMarketDataSource` — a push stream an adapter implements (`start`/`stop`).
- `OrderBookSnapshotSource` — the neutral seam used to fetch a fresh snapshot on recovery.

Adding a new venue is a matter of implementing these interfaces; **no ingestion-core change is
required**. The isolation is enforced by a contract test
([`tests/contract.test.ts`](tests/contract.test.ts)) that scans the sources for forbidden imports.

## Canonical flow

```
Provider adapter
   → MarketDataIngestionGateway            (intake, receive-time stamp)
   → IngestionRouter                       (classify: order-book | sequenced | stateless)
   → SchemaValidator                       (structural / required-field / finiteness)
   → SymbolNormalizer                      (venue symbol → canonical instrument id)
   → DataQualityValidator                  (price/qty/timestamp/impossible-state)
   → SequenceValidator + DuplicateDetector (dup / out-of-order / gap)   ── sequenced streams
     | OrderBookSynchronizer               (snapshot+delta, gap → degrade → resync) ── order books
   → CanonicalNormalizer                   (immutable record + canonical timestamps + provenance)
   → IngestionBuffer                       (bounded, backpressure)
   → BatchProcessor                        (batch write, retry, dead-letter)
   → CanonicalMarketDataStore
```

Nothing invalid is ever silently accepted or dropped: every rejection is **quarantined in the
dead-letter queue with a stable reason**, and every drop (duplicate, out-of-order, overflow, gap) is
counted in `IngestionMetrics` and reflected in `IngestionHealthMonitor`.

## Determinism

All wall-clock access is via an injected `Clock` (`SystemClock` in production, `ManualClock` in
tests). There are no ambient timers: the `BatchProcessor` is drained by the caller (`flush`), so a
host scheduler owns the cadence. Every model is immutable and every stage is pure or holds only
explicit per-stream state.

## Gates

`pnpm --filter @platform/market-data-ingestion typecheck | lint | test` — 75 unit / integration /
contract tests.
