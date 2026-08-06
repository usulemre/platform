# @platform/market-data-sdk

The shared **Market Data SDK** (Phase 6.3). It is the single source of truth for
the market-data _vocabulary_ and is consumed by both the `market-data-service` and
its administration UI so the two tiers speak exactly the same language.

## Contents

- **Asset classes** (`asset-classes.ts`) — the asset-agnostic class taxonomy.
- **Timeframes** (`timeframes.ts`) — ordered time-series resolutions (`tick`…`1w`).
- **Market-data types** (`market-data-types.ts`) — OHLCV, trades, order books,
  funding rates, open interest, liquidations, options, volatility surface, index
  prices, mark prices, corporate actions, macro, reference data.
- **Capabilities** (`capabilities.ts`) — symbol resolution, dataset versioning,
  time-series retrieval, historical data, incremental updates, snapshots,
  metadata management, data catalog, market calendar, trading hours, exchange
  metadata.
- **Statuses** (`statuses.ts`) — dataset / coverage / quality / session enums.
- **Contracts** (`contracts.ts`) — the canonical models: asset, exchange, market,
  trading pair, instrument, contract, symbol, currency, dataset, time series,
  market event, trading session, holiday calendar, metadata.
- **Symbols** (`symbols.ts`) — pure symbol-resolution primitives.

## Boundaries

Vocabulary and pure logic only. **No** exchange-specific logic, **no** provider
SDKs, **no** persistence, **no** transport, **no** secrets. Concrete data lands in
canonical datasets produced by the Data Ingestion Pipeline.
