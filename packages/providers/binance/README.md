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

## WebSocket Market Data Streams (`src/websocket`, Phase 9.1.3)

The canonical real-time market-data provider. It subscribes to the officially-documented Binance
market streams (Spot & USDⓈ-M Futures) and maps every event into the canonical domain. Market data
**only** — no authenticated user streams, no orders, no account management.

| Component                                                                                                                                                                        | Responsibility                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `BinanceMarketDataSocket`                                                                                                                                                        | facade over the Common WebSocket Client (combined `/stream`, SUBSCRIBE/UNSUBSCRIBE, reconnect/resubscribe, liveness watchdog) |
| `SubscriptionManager`                                                                                                                                                            | ref-counted stream fan-out over the shared client                                                                             |
| `EventRouter` / `EventMapper` / `MarketDataValidator`                                                                                                                            | stream-name dispatch → validate → canonical event                                                                             |
| `TradeStream` / `AggregateTradeStream` / `TickerStream` / `MiniTickerStream` / `BookTickerStream` / `KlineStream` / `AveragePriceStream` / `MarkPriceStream` / `OrderBookStream` | typed per-channel subscriptions                                                                                               |
| `OrderBookSynchronizer` (+ `LocalOrderBook`, `SequenceValidator`, `GapDetector`)                                                                                                 | maintained local book per the official buffer→snapshot→apply procedure, with sequence validation & gap-triggered resync       |
| `ChannelRegistry`                                                                                                                                                                | documented stream-name builders + market scoping + enum values                                                                |
| `MarketDataMetrics` / `MarketDataHealthMonitor`                                                                                                                                  | per-stream counters / deterministic liveness health                                                                           |

Canonical events: `MarketTradeEvent`, `AggregateTradeEvent`, `TickerEvent`, `BookTickerEvent`,
`OrderBookSnapshot`, `OrderBookDelta`, `CandlestickEvent`, `AveragePriceEvent`, `MarkPriceEvent` — all
immutable. Reach it from the provider via `provider.marketDataSocket(ctx)` (requires a socket factory).
Only officially-documented stream names, payload fields and enum values are used.

## Authentication & User Data Streams (`src/auth`, Phase 9.1.4)

The canonical authenticated-communication layer. It securely authenticates (HMAC-SHA256 signing via
the Authentication Core, secrets by reference), aligns the clock to the venue, manages the listen-key
lifecycle, maintains an authenticated user data stream, and maps every account event into the
canonical domain. It signs requests and manages sessions — **no order placement, no trading logic**.

| Component                                                                              | Responsibility                                                                                       |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `BinanceAuthenticationService`                                                         | facade: authenticate (verify creds + sync clock), expose signer + user data stream                   |
| `RequestSigner`                                                                        | server-aligned HMAC-SHA256 signing (over the reused `BinanceAuthentication`)                         |
| `ServerTimeSynchronizer` / `ClockSynchronizer`                                         | clock-drift compensation for signed requests                                                         |
| `ListenKeyManager` / `ListenKeyRefresher`                                              | listen-key create/keep-alive/expiry + automatic 30-min refresh                                       |
| `UserDataStream`                                                                       | authenticated WS user data stream: canonical events, re-auth on `listenKeyExpired`, session recovery |
| `AuthenticatedWebSocketClient`                                                         | thin wrapper over the Common WebSocket Client bound to `/ws/<listenKey>`                             |
| `AuthenticatedRestClient` (+ adapter over `BinanceRestClient`)                         | authenticated REST port: server time, listen-key lifecycle, account snapshot                         |
| `AuthenticationEventMapper` / `AuthenticationValidator` / `AuthenticationStateManager` | canonical mapping / payload + recvWindow validation / auth state machine                             |
| `UserDataMetrics` / `UserDataHealthMonitor`                                            | event counters / deterministic health                                                                |

Canonical events: `AccountUpdatedEvent`, `BalanceUpdatedEvent`, `PositionUpdatedEvent`,
`OrderUpdatedEvent`, `ExecutionReportEvent`, `TradeExecutionEvent`, `ListenKeyExpiredEvent`,
`AuthenticationStateChangedEvent` — all immutable. Reach it from the provider via
`provider.authenticationService(ctx)`. Only officially-documented endpoints, payloads and events used.

## Composition

`providerFactories` are the zero-argument factories the broker-gateway service merges into its
provider registry (unchanged integration seam). Use `createBinanceProvider({ transport,
socketFactory, secretProvider, clock, ... })` to build a fully-injected adapter.
