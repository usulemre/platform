# Market Data (admin UI, Phase 6.3)

The administration interface for the canonical **Market Data Platform**, inside
`admin-web`. It surfaces the unified, normalized, versioned view of market data
managed by `services/market-data-service` and speaks the shared vocabulary from
`@platform/market-data-sdk`.

## What it is (and is not)

- **Is:** a read-only console — dashboard, symbol/exchange/asset registries,
  dataset explorer + details, time-series explorer, data coverage, data-quality
  overview, data-version explorer, metadata explorer, market calendar, trading
  sessions and the data catalog.
- **Is not:** a data plane. It never retrieves real market data, never talks to a
  provider or storage, and contains no exchange-specific logic and no business
  logic in components (formatting/aggregation is in the pure mappers/service).

## Shared contracts

The canonical models and enums (asset classes, timeframes, market-data types,
capabilities, statuses, and the asset/exchange/symbol/dataset/… models) come from
**`@platform/market-data-sdk`** — the single source of truth shared with the
service tier, which in turn consumes canonical datasets from the Data Ingestion
Pipeline.

## Layering

```
components / routes  →  hooks  →  application (MarketDataService)
                                     →  data (MarketDataRepository + Mock/Api)
                                     →  domain (VM / mappers / query, over @platform/market-data-sdk)
```

Swap `MockMarketDataRepository` for `new ApiMarketDataRepository(apiClient)` in
`application/container.ts` (over the market-data service gateway) to go live — no
hook/service/UI change.

## Routes

`/market-data` (dashboard, with loading + error), `/market-data/symbols` (+
`/[symbolId]`), `/market-data/exchanges`, `/market-data/assets`,
`/market-data/datasets` (+ `/[datasetId]`), `/market-data/calendar`,
`/market-data/catalog`. A nav link and a home-page card are wired into `admin-web`.
