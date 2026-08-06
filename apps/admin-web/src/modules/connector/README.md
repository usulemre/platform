# Connector Management Platform (Phase 6.1)

The canonical integration layer of the platform, inside `admin-web`. It provides
centralized **lifecycle management for connector abstractions** used by research,
datasets, market data, execution, monitoring and AI agents.

## What it is (and is not)

- **Is:** a governance/administration surface over connector _abstractions_ and
  their metadata — registry, health, status, configuration, capabilities,
  versioning, lifecycle, metrics, diagnostics, validation and activity.
- **Is not:** a client to any external API. It performs **no external
  communication, no HTTP, no SDK usage, and holds no secrets**. Actual provider
  implementations belong to future infrastructure packages and bind to the type
  descriptors produced by the Connector Factory. Credentials are referenced by a
  brokered pointer only (CLAUDE.md SEC-3); **Credentials** and **Logs** panels are
  placeholders.

## Canonical models (`domain/`)

`dto.ts` defines Connector, Connector Type, Connector Capability, Connector
Configuration, Connector Health, Connector Status, Connector Validation,
Connector Metrics, Connector Version and Connector Diagnostics. `catalog.ts`
holds the **Connector Type catalog** and the **Connector Factory** — a pure
abstraction that, given a type, yields its descriptor/blueprint (it never
instantiates a live connector or transport). The **Connector Registry** is the
`ConnectorRepository` boundary in `data/`.

## Supported types

`MARKET_DATA, EXCHANGE, BROKER, OPTIONS, BLOCKCHAIN, NEWS, MACRO_DATA, ALT_DATA,
AI_PROVIDER, STORAGE, NOTIFICATION` — the core never branches on a specific
provider (CP-8).

## Initial connector placeholders (seed)

Binance, Hyperliquid, Deribit, Polygon, Alpaca, Interactive Brokers, BIST,
Finnhub, Tiingo, Alpha Vantage, Federal Reserve (FRED), SEC EDGAR, OpenAI,
Anthropic, Google Gemini.

## Layering

```
components / routes  →  hooks  →  application (ConnectorService)
                                     →  data (ConnectorRepository + Mock/Api)
                                     →  domain (DTO / VM / mappers / query / catalog)
```

- **application** — `connector-service.ts` (the only layer hooks call),
  `container.ts` (composition root). Swap `MockConnectorRepository` for
  `new ApiConnectorRepository(apiClient)` (over the Connector Registry gateway)
  to go live — no hook/service/UI change.
- **hooks** — `use-connectors.ts` (TanStack Query), `use-connector-query-store.ts`
  (Zustand, list-control UI state only).
- **components** — logic-free presentation; `connector-atoms.tsx` holds shared
  primitives. Panels cover every deliverable; `ConnectorCredentials` and
  `ConnectorLogs` are explicit placeholders.

## Routes

`/connectors` (dashboard + registry, with loading + error) and
`/connectors/[connectorId]` (details). A nav link and a home-page card are wired
into `admin-web`.

## Integrations

Configuration Foundation (`configRef`, config fields), Validation Foundation
(validation report), Monitoring (health/metrics/logs surfacing), Authentication /
Audit / Notification centers and the AI Agent Console (AI provider connectors are
bound via the Model Registry, metadata only). All references only — no direct
infrastructure coupling.
