# @platform/websocket-client

The canonical **Common WebSocket Client Foundation** — the provider-independent real-time communication
framework for exchanges, brokers and market-data providers (Phase 8.1.7). It reuses the
`@platform/http-client` `Scheduler` (and its backoff) for deterministic timing.

## What it provides

- **Injectable transport**: `SocketFactory` / `Socket` — production wires a `ws`/browser adapter, tests
  inject a fake. No real network needed.
- **9-state machine**: `DISCONNECTED → CONNECTING → CONNECTED → AUTHENTICATING → AUTHENTICATED →
SUBSCRIBED → HEALTHY`, plus `RECONNECTING` and `CLOSED` (`ConnectionStateMachine`, `canTransition`).
- **Messaging**: `MessageCodec` (`JsonMessageCodec` default), `MessageRouter` (control / correlated
  response / topic routing with injected extractors), `Correlator` (request/response), `EventDispatcher`.
- **Lifecycle managers**: `ConnectionManager`, `SessionManager`, `SubscriptionManager` (auto
  re-subscribe), `ChannelRegistry`, `HeartbeatManager` (ping/pong + timeout), `ReconnectEngine`
  (exponential backoff + jitter), `ConnectionMetrics`, `ConnectionContext`.
- **Facade**: `WebSocketClient` — `connect`/`close`/`send`/`request`/`subscribe`/`unsubscribe`/`on`, with
  outbound **buffering + backpressure**, **graceful shutdown**, typed events and metrics.
- **`ConnectionPool`** (foundation) — one client per endpoint/shard.

## Canonical errors

`ConnectionError`, `AuthenticationError`, `SubscriptionError`, `HeartbeatTimeoutError`,
`ReconnectFailedError`, `SerializationError`, `ProtocolError`, `UnknownMessageError`.

## Determinism & provider-independence

Every side effect — time and timers — is injected via the `Scheduler`, and the socket via
`SocketFactory`, so runs are fully deterministic and unit-testable without a network. **No provider
protocol is implemented**: subscribe/ping frames, topic/correlation extraction and authentication are
injected hooks.

## Example

```ts
import { WebSocketClient } from '@platform/websocket-client';

const client = new WebSocketClient({
  url: 'wss://stream.example.com',
  factory: mySocketFactory, // adapts ws / browser WebSocket
  heartbeat: { intervalMs: 15_000, timeoutMs: 5_000 },
  reconnect: { baseDelayMs: 500, maxDelayMs: 30_000, jitter: 'equal' },
});
client.on('message', ({ message }) => {});
await client.connect();
client.subscribe('trades', (m) => {});
```

## Scripts

`pnpm --filter @platform/websocket-client typecheck | lint | test | bench`
