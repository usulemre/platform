# @platform/data-sdk

The shared **Data SDK** for the platform's ingestion layer (Phase 6.2). It is the
single source of truth for the ingestion _vocabulary_ and is consumed by both the
`data-ingestion-service` and its administration UI so the two tiers speak exactly
the same language.

## Contents

- **Pipeline stages** (`pipeline-stages.ts`) — the fixed, ordered path
  `Source → Connector → Raw payload → Decoder → Schema validation → Normalization
→ Canonical dataset → Quality validation → Dataset registry → Storage`.
- **Data-type catalog** (`data-types.ts`) — the asset-agnostic classes of data
  the platform can ingest (OHLCV, trades, order books, funding rates, open
  interest, liquidations, options chains, volatility surface, corporate actions,
  macro, news, alternative data).
- **Pipeline capabilities** (`capabilities.ts`) — reusable building blocks
  (source registration, definition, execution, schema validation, normalization,
  deduplication, versioning, quality validation, metadata generation, error
  handling, retry policies, dead-letter queue, metrics, events).
- **Statuses** (`statuses.ts`) — shared pipeline/job/health/quality enums.
- **Primitives** (`primitives.ts`) — pure, deterministic helpers backing the
  retry, deduplication and quality-validation capabilities (no IO, no time, no
  randomness — CS-3).
- **Contracts** (`contracts.ts`) — the transport-agnostic shapes exchanged
  across tiers.

## Boundaries

Vocabulary and pure logic only. **No** provider logic, **no** storage, **no**
message broker, **no** transport, **no** secrets. Concrete implementations live in
the service's infrastructure adapters and future infrastructure packages.
