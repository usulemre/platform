/**
 * `@platform/provider-binance/auth` — the Binance Authentication & User Data Streams (Phase 9.1.4): the
 * canonical authenticated-communication layer for the Binance adapter. It securely authenticates
 * (HMAC-SHA256 signing via the Authentication Core, secrets by reference), synchronizes the clock to
 * the venue, manages the listen-key lifecycle, maintains an authenticated user data stream over the
 * Common WebSocket Client, and maps every account event into the canonical domain. It signs requests
 * and manages sessions — it never places orders or runs trading logic.
 */
export * from './events';
export type * from './binance-user-events';
export {
  BinanceAuthentication,
  encodeParams,
  type BinanceAuthenticationDeps,
  type BinanceParamValue,
} from './authentication';
export { RequestSigner } from './signer';
export { ClockSynchronizer, ServerTimeSynchronizer } from './clock';
export {
  AuthenticationStateManager,
  type AuthStateListener,
  type AuthenticationStateManagerDeps,
} from './state';
export { BinanceAuthenticatedRestClient, type AuthenticatedRestClient } from './rest';
export {
  ListenKeyManager,
  LISTEN_KEY_VALIDITY_MS,
  type ListenKeyManagerDeps,
} from './listen-key-manager';
export {
  ListenKeyRefresher,
  DEFAULT_KEEPALIVE_INTERVAL_MS,
  type ListenKeyRefresherDeps,
  type ListenKeyRefresherCallbacks,
} from './listen-key-refresher';
export { AuthenticationValidator } from './validator';
export { AuthenticationEventMapper, type OrderEventBundle } from './event-mapper';
export { AuthenticatedWebSocketClient, type AuthenticatedWebSocketClientDeps } from './ws-client';
export { UserDataStream, type UserDataStreamDeps, type AccountEventMap } from './user-data-stream';
export {
  UserDataMetrics,
  UserDataHealthMonitor,
  type UserDataMetricsSnapshot,
  type UserDataHealth,
  type UserDataHealthLevel,
} from './metrics';
export {
  BinanceAuthenticationService,
  createBinanceAuthenticationService,
  type AuthenticationResult,
  type BinanceAuthenticationServiceDeps,
} from './service';
