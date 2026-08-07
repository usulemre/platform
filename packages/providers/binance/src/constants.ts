/**
 * Binance provider constants — the venue markets, default endpoints and the canonical REST paths for
 * both Spot and USDⓈ-M Futures. These are inert configuration values (URLs and path templates), NOT
 * transport: nothing here opens a connection. Endpoints are overridable through {@link BinanceConfig}
 * so the same adapter serves production, testnet and a local mock without code change.
 */

/** The two Binance venue markets this provider serves. */
export type BinanceMarket = 'SPOT' | 'FUTURES';

/** The provider ids served by this package, mapped to their market. */
export const MARKET_BY_PROVIDER = {
  binance: 'SPOT',
  'binance-futures': 'FUTURES',
} as const;

/** Default REST/WebSocket base URLs per market and environment (production vs testnet). */
export const DEFAULT_ENDPOINTS = {
  SPOT: {
    production: { rest: 'https://api.binance.com', ws: 'wss://stream.binance.com:9443' },
    testnet: { rest: 'https://testnet.binance.vision', ws: 'wss://testnet.binance.vision' },
  },
  FUTURES: {
    production: { rest: 'https://fapi.binance.com', ws: 'wss://fstream.binance.com' },
    testnet: { rest: 'https://testnet.binancefuture.com', ws: 'wss://stream.binancefuture.com' },
  },
} as const;

/** Canonical REST paths, per market. `signed` endpoints require an HMAC signature + API key header. */
export const REST_PATHS = {
  SPOT: {
    ping: '/api/v3/ping',
    time: '/api/v3/time',
    exchangeInfo: '/api/v3/exchangeInfo',
    depth: '/api/v3/depth',
    klines: '/api/v3/klines',
    ticker24h: '/api/v3/ticker/24hr',
    account: '/api/v3/account',
    openOrders: '/api/v3/openOrders',
    allOrders: '/api/v3/allOrders',
    order: '/api/v3/order',
    cancelAllOrders: '/api/v3/openOrders',
    cancelReplace: '/api/v3/order/cancelReplace',
    myTrades: '/api/v3/myTrades',
    listenKey: '/api/v3/userDataStream',
  },
  FUTURES: {
    ping: '/fapi/v1/ping',
    time: '/fapi/v1/time',
    exchangeInfo: '/fapi/v1/exchangeInfo',
    depth: '/fapi/v1/depth',
    klines: '/fapi/v1/klines',
    ticker24h: '/fapi/v1/ticker/24hr',
    account: '/fapi/v2/account',
    balance: '/fapi/v2/balance',
    positionRisk: '/fapi/v2/positionRisk',
    openOrders: '/fapi/v1/openOrders',
    allOrders: '/fapi/v1/allOrders',
    order: '/fapi/v1/order',
    cancelAllOrders: '/fapi/v1/allOpenOrders',
    userTrades: '/fapi/v1/userTrades',
    listenKey: '/fapi/v1/listenKey',
  },
} as const;

/** The HTTP header Binance expects the API key in. */
export const API_KEY_HEADER = 'X-MBX-APIKEY';

/** Default signed-request receive window (ms) — how long a signed request stays valid server-side. */
export const DEFAULT_RECV_WINDOW_MS = 5000;

/** Default time-sync validity window (ms) before the server-time offset is re-fetched. */
export const DEFAULT_TIME_SYNC_TTL_MS = 60_000;

/** Default exchange-info cache TTL (ms). */
export const DEFAULT_EXCHANGE_INFO_TTL_MS = 6 * 60 * 60 * 1000;
