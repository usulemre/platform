# provider-binance

Production broker/venue provider adapter for **Binance (Spot)** and **Binance Futures** (Phase 9.1).

Implements the canonical Broker Gateway capability contract (`BrokerProviderPort` from
`@platform/broker-sdk`) and a richer canonical trading/market-data surface on top. It is built
entirely on the shared foundations and is strictly isolated — it depends **only** on the Broker
Gateway SDK and the common foundations, never on other platform modules, and every venue specific
(REST paths, request signing, WebSocket protocol, field names, error codes) is confined to this
package behind the canonical contracts.

## Built on

- **`@platform/http-client`** — REST transport, plus the Retry & Timeout, Circuit Breaker composition.
- **`@platform/rate-limiter`** — provider-scoped request pacing (Binance weight/minute).
- **`@platform/auth-core`** — HMAC-SHA256 request signing; secrets resolved **by reference** only.
- **`@platform/websocket-client`** — ticker / kline / order-book / user-data streams.
- **`@platform/broker-sdk`** — the capability contract, lifecycle, health computation and descriptors.

## Structure

| Component                                                                     | Responsibility                                                              |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `BinanceProvider`                                                             | `BrokerProviderPort` implementation + canonical trading/market-data surface |
| `BinanceRestClient`                                                           | typed Spot + Futures REST surface over the resilient HTTP client            |
| `BinanceWebSocketClient`                                                      | Binance stream conventions over the common WebSocket client                 |
| `BinanceAuthentication`                                                       | request signing / API-key headers (secrets by reference)                    |
| `BinanceMapper` (+ symbol/order/trade/balance/position/execution/market-data) | canonical ⇄ Binance translation                                             |
| `BinanceErrorMapper`                                                          | venue/transport failures → classified `BinanceError` hierarchy              |
| `BinanceExchangeInfoCache` / `BinanceServerTimeSync`                          | instrument metadata cache / signed-request clock alignment                  |
| `BinanceCapabilityRegistry` / `BinanceHealthMonitor`                          | declared capabilities / deterministic health                                |
| `resolveBinanceConfiguration`                                                 | fail-closed config resolution (endpoints, references, tuning)               |

## Isolation & safety

- **No business logic outside the provider boundary.** The adapter only translates and transports.
- **Secrets by reference.** The API key/secret are resolved through an injected `SecretProvider`;
  no secret is stored, logged, or serialized. Missing references fail closed.
- **Deterministic.** Transport, socket factory, clock and scheduler are all injected — the package
  opens no network and reads no wall-clock ambiently, so it is fully testable.

## Exchange Metadata & Symbol Registry (`src/metadata`, Phase 9.1.1)

The canonical metadata foundation and **single source of truth for Binance symbols**. It discovers,
validates, caches and exposes exchange metadata, mapping every venue model into the canonical domain.
It contains **no** market-data streams, **no** orders and **no** trading logic.

| Component                                                                                                | Responsibility                                                   |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `ExchangeMetadataService`                                                                                | facade: discovery + validation + cache + derived registries      |
| `MetadataRefresher`                                                                                      | fetch → validate → map → validate → store (TTL-aware)            |
| `ExchangeMetadataMapper` (+ `ExchangeSymbolMapper`/`FilterMapper`/`PrecisionMapper`/`TradingRuleMapper`) | raw exchangeInfo → canonical `ExchangeMetadata`/`ExchangeSymbol` |
| `SymbolRegistry` / `TradingPairRegistry` / `AssetRegistry` / `ExchangeCapabilityRegistry`                | immutable indexed read models                                    |
| `MetadataValidator`                                                                                      | structural validation (raw + mapped)                             |
| `ExchangeMetadataCache` / `ExchangeMetadataRepository`                                                   | TTL cache / per-market persistence port                          |

Canonical models: `ExchangeMetadata`, `ExchangeSymbol`, `TradingPair`, `AssetMetadata`,
`ExchangeFilter`, `TradingRule`, `PrecisionRule`, `RateLimitMetadata`, `ExchangeCapability`. All are
immutable; the registries are thread-safe by immutability. Discovery runs through the injected
metadata source (the REST client, backed by the Common HTTP Client). Reach it from the provider via
`provider.metadataService(ctx)`.

## Composition

`providerFactories` are the zero-argument factories the broker-gateway service merges into its
provider registry (unchanged integration seam). Use `createBinanceProvider({ transport,
socketFactory, secretProvider, clock, ... })` to build a fully-injected adapter.
