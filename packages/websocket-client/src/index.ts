/**
 * @platform/websocket-client — the Common WebSocket Client Foundation.
 *
 * The canonical, provider-independent real-time communication framework for exchanges, brokers and
 * market-data providers. It provides an injectable socket transport, a 9-state connection state
 * machine (disconnected → connecting → connected → authenticating → authenticated → subscribed →
 * healthy, with reconnecting/closed), a message codec, an event dispatcher, connection/session/
 * subscription managers, a channel registry, a message router with request/response correlation, a
 * heartbeat manager, a reconnect engine (exponential backoff + jitter), connection metrics/context, the
 * `WebSocketClient` facade (message buffering, backpressure, graceful shutdown, automatic
 * re-subscription) and a connection-pool foundation.
 *
 * Every side effect — time and timers — is injected through the `@platform/http-client` `Scheduler`
 * seam (and the socket via `SocketFactory`), so runs are fully deterministic and unit-testable without
 * a real network. NO provider protocol is implemented: subscribe/ping frames, topic/correlation
 * extraction and authentication are injected hooks.
 */
export * from './transport';
export * from './state';
export * from './state-machine';
export * from './errors';
export * from './codec';
export * from './events';
export * from './context';
export * from './metrics';
export * from './channel';
export * from './subscription';
export * from './correlation';
export * from './router';
export * from './heartbeat';
export * from './reconnect';
export * from './session';
export * from './connection';
export * from './client';
export * from './pool';
