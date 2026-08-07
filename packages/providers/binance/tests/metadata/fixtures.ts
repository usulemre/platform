/**
 * Shared raw-exchangeInfo fixtures for the Exchange Metadata & Symbol Registry tests. Deterministic
 * data only — no network.
 */
import type { BinanceExchangeInfo } from '../../src/types/binance';

/** A representative Spot exchangeInfo: two trading pairs, one halted, with filters + rate limits. */
export const SPOT_EXCHANGE_INFO: BinanceExchangeInfo = {
  timezone: 'UTC',
  serverTime: 1_700_000_000_000,
  rateLimits: [
    { rateLimitType: 'REQUEST_WEIGHT', interval: 'MINUTE', intervalNum: 1, limit: 1200 },
    { rateLimitType: 'ORDERS', interval: 'SECOND', intervalNum: 10, limit: 50 },
  ],
  symbols: [
    {
      symbol: 'BTCUSDT',
      status: 'TRADING',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      baseAssetPrecision: 8,
      quoteAssetPrecision: 8,
      orderTypes: ['LIMIT', 'MARKET', 'STOP_LOSS_LIMIT'],
      permissions: ['SPOT', 'MARGIN'],
      isSpotTradingAllowed: true,
      isMarginTradingAllowed: true,
      filters: [
        { filterType: 'PRICE_FILTER', minPrice: '0.01', maxPrice: '1000000', tickSize: '0.01' },
        { filterType: 'LOT_SIZE', minQty: '0.00001', maxQty: '9000', stepSize: '0.00001' },
        { filterType: 'MIN_NOTIONAL', minNotional: '10' },
        { filterType: 'MAX_NUM_ORDERS', maxNumOrders: 200 },
      ],
    },
    {
      symbol: 'ETHBTC',
      status: 'TRADING',
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      orderTypes: ['LIMIT', 'MARKET'],
      permissions: ['SPOT'],
      isSpotTradingAllowed: true,
      filters: [
        { filterType: 'PRICE_FILTER', minPrice: '0.000001', tickSize: '0.000001' },
        { filterType: 'LOT_SIZE', minQty: '0.001', stepSize: '0.001' },
        { filterType: 'NOTIONAL', notional: '0.0001' },
      ],
    },
    {
      symbol: 'LUNAUSDT',
      status: 'HALT',
      baseAsset: 'LUNA',
      quoteAsset: 'USDT',
      permissions: ['SPOT'],
      filters: [{ filterType: 'LOT_SIZE', minQty: '0.1', stepSize: '0.1' }],
    },
  ],
};

/** A representative USDⓈ-M Futures exchangeInfo: one perpetual with explicit precision. */
export const FUTURES_EXCHANGE_INFO: BinanceExchangeInfo = {
  timezone: 'UTC',
  serverTime: 1_700_000_000_500,
  rateLimits: [
    { rateLimitType: 'REQUEST_WEIGHT', interval: 'MINUTE', intervalNum: 1, limit: 2400 },
  ],
  symbols: [
    {
      symbol: 'BTCUSDT',
      status: 'TRADING',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      contractType: 'PERPETUAL',
      pricePrecision: 2,
      quantityPrecision: 3,
      orderTypes: ['LIMIT', 'MARKET', 'STOP'],
      filters: [
        { filterType: 'PRICE_FILTER', minPrice: '0.10', maxPrice: '4000000', tickSize: '0.10' },
        { filterType: 'LOT_SIZE', minQty: '0.001', maxQty: '1000', stepSize: '0.001' },
        { filterType: 'MIN_NOTIONAL', notional: '5' },
      ],
    },
  ],
};
