# Data Ingestion (admin UI, Phase 6.2)

The administration interface for the canonical **Data Ingestion Pipeline**, inside
`admin-web`. It surfaces the pipelines managed by `services/data-ingestion-service`
and speaks the shared vocabulary defined in `@platform/data-sdk`.

## What it is (and is not)

- **Is:** a read-only console over ingestion metadata — dashboard, pipeline
  registry, pipeline details (status, health, metrics, validation, monitoring),
  failed jobs, retry/dead-letter queues, pipeline history, and data-source /
  data-quality overviews.
- **Is not:** a data plane. It never talks to providers, a broker, or storage, and
  contains no business logic in components (all formatting/aggregation is in the
  pure mappers/service).

## Shared contracts

The canonical shapes and enums (pipeline stages, data types, capabilities,
statuses, quality) come from **`@platform/data-sdk`** — the single source of truth
shared with the service tier. This module adds only presentation (view models +
mappers) and its own mock repository.

## Layering

```
components / routes  →  hooks  →  application (DataIngestionService)
                                     →  data (DataIngestionRepository + Mock/Api)
                                     →  domain (VM / mappers / query, over @platform/data-sdk)
```

Swap `MockDataIngestionRepository` for `new ApiDataIngestionRepository(apiClient)`
in `application/container.ts` (over the data-ingestion service gateway) to go
live — no hook/service/UI change.

## Routes

`/data-ingestion` (dashboard + registry, with loading + error),
`/data-ingestion/[pipelineId]` (details), `/data-ingestion/failed-jobs`, and
`/data-ingestion/retry-queue`. A nav link and a home-page card are wired into
`admin-web`.
