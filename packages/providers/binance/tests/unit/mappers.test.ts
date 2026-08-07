import { describe, expect, it } from 'vitest';
import { BinanceMapper } from '../../src/mappers/mapper';
import type {
  BinanceExecutionReport,
  BinanceFuturesBalance,
  BinanceOrder,
  BinancePositionRisk,
  BinanceSpotBalance,
  BinanceSymbolInfo,
  BinanceUserTrade,
} from '../../src/types/binance';

const SYMBOL_INFO: BinanceSymbolInfo = {
  symbol: 'BTCUSDT',
  status: 'TRADING',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  filters: [
    { filterType: 'PRICE_FILTER', tickSize: '0.01' },
    { filterType: 'LOT_SIZE', stepSize: '0.001' },
    { filterType: 'MIN_NOTIONAL', minNotional: '10' },
  ],
};

describe('BinanceSymbolMapper', () => {
  const mapper = new BinanceMapper('SPOT');

  it('translates canonical BASE-QUOTE ⇄ Binance BASEQUOTE', () => {
    expect(mapper.symbols.toBinance('BTC-USDT')).toBe('BTCUSDT');
    expect(mapper.symbols.toBinance('btc/usdt')).toBe('BTCUSDT');
    expect(mapper.symbols.toCanonicalSymbol('BTCUSDT', SYMBOL_INFO)).toBe('BTC-USDT');
  });

  it('extracts precision and filters from exchange info', () => {
    const canonical = mapper.symbols.toCanonical(SYMBOL_INFO);
    expect(canonical).toMatchObject({
      symbol: 'BTC-USDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      assetClass: 'CRYPTO',
      tickSize: 0.01,
      stepSize: 0.001,
      minNotional: 10,
    });
    expect(canonical.pricePrecision).toBe(2);
    expect(canonical.quantityPrecision).toBe(3);
  });

  it('classifies futures perpetuals', () => {
    const futures = new BinanceMapper('FUTURES');
    expect(
      futures.symbols.toCanonical({ ...SYMBOL_INFO, contractType: 'PERPETUAL' }).assetClass,
    ).toBe('CRYPTO_PERP');
  });
});

describe('BinanceOrderMapper', () => {
  const mapper = new BinanceMapper('SPOT');

  it('maps a canonical limit request to Binance params', () => {
    const params = mapper.orders.toBinanceParams({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1.5,
      price: 25000,
      timeInForce: 'GTC',
      clientOrderId: 'abc',
    });
    expect(params).toMatchObject({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1.5,
      price: 25000,
      timeInForce: 'GTC',
      newClientOrderId: 'abc',
    });
  });

  it('omits price/TIF for a market order', () => {
    const params = mapper.orders.toBinanceParams({
      symbol: 'BTC-USDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: 2,
    });
    expect(params['type']).toBe('MARKET');
    expect(params['price']).toBeUndefined();
    expect(params['timeInForce']).toBeUndefined();
  });

  it('projects a raw order onto the canonical order and sync record', () => {
    const raw: BinanceOrder = {
      symbol: 'BTCUSDT',
      orderId: 42,
      clientOrderId: 'abc',
      price: '25000',
      origQty: '2',
      executedQty: '0.5',
      status: 'PARTIALLY_FILLED',
      timeInForce: 'GTC',
      type: 'LIMIT',
      side: 'BUY',
      time: 1_700_000_000_000,
    };
    const canonical = mapper.orders.toCanonical(raw, SYMBOL_INFO);
    expect(canonical).toMatchObject({
      venueOrderId: '42',
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      status: 'PARTIALLY_FILLED',
      quantity: 2,
      filledQuantity: 0.5,
      remainingQuantity: 1.5,
    });
    const sync = mapper.orders.toSyncRecord(raw, SYMBOL_INFO);
    expect(sync).toMatchObject({
      brokerOrderId: '42',
      clientOrderId: 'abc',
      status: 'PARTIALLY_FILLED',
      filledQuantity: 0.5,
      remainingQuantity: 1.5,
    });
  });
});

describe('balance / position / trade / execution mappers', () => {
  it('maps spot balances, dropping empty lines', () => {
    const balances: BinanceSpotBalance[] = [
      { asset: 'BTC', free: '1.0', locked: '0.5' },
      { asset: 'ETH', free: '0', locked: '0' },
    ];
    const mapped = new BinanceMapper('SPOT').balances.fromSpotMany(balances);
    expect(mapped).toEqual([{ currency: 'BTC', total: 1.5, available: 1.0 }]);
  });

  it('maps futures balances', () => {
    const balances: BinanceFuturesBalance[] = [
      { asset: 'USDT', balance: '1000', availableBalance: '800' },
    ];
    expect(new BinanceMapper('FUTURES').balances.fromFuturesMany(balances)).toEqual([
      { currency: 'USDT', total: 1000, available: 800 },
    ]);
  });

  it('maps futures positions, dropping flat rows and preserving short direction', () => {
    const positions: BinancePositionRisk[] = [
      { symbol: 'BTCUSDT', positionAmt: '-0.4', entryPrice: '25000' },
      { symbol: 'ETHUSDT', positionAmt: '0', entryPrice: '0' },
    ];
    const mapped = new BinanceMapper('FUTURES').positions.fromPositionRiskMany(positions);
    expect(mapped).toEqual([
      { symbol: 'BTCUSDT', quantity: -0.4, averagePrice: 25000, assetClass: 'CRYPTO_PERP' },
    ]);
  });

  it('maps a user trade to a canonical trade', () => {
    const trade: BinanceUserTrade = {
      id: 7,
      orderId: 42,
      symbol: 'BTCUSDT',
      price: '25000',
      qty: '0.5',
      commission: '0.1',
      commissionAsset: 'USDT',
      isBuyer: true,
      isMaker: false,
      time: 1_700_000_000_000,
    };
    expect(new BinanceMapper('SPOT').trades.toCanonical(trade, SYMBOL_INFO)).toMatchObject({
      tradeId: '7',
      venueOrderId: '42',
      symbol: 'BTC-USDT',
      side: 'BUY',
      price: 25000,
      quantity: 0.5,
      fee: 0.1,
      feeCurrency: 'USDT',
      maker: false,
    });
  });

  it('maps an execution report to a canonical execution', () => {
    const report: BinanceExecutionReport = {
      e: 'executionReport',
      s: 'BTCUSDT',
      S: 'SELL',
      o: 'LIMIT',
      X: 'FILLED',
      i: 42,
      c: 'abc',
      l: '0.5',
      z: '2',
      L: '25010',
      E: 1_700_000_000_000,
    };
    expect(new BinanceMapper('SPOT').executions.toCanonical(report, SYMBOL_INFO)).toMatchObject({
      venueOrderId: '42',
      clientOrderId: 'abc',
      symbol: 'BTC-USDT',
      side: 'SELL',
      status: 'FILLED',
      lastFilledQuantity: 0.5,
      cumulativeFilledQuantity: 2,
      lastFilledPrice: 25010,
      orderType: 'LIMIT',
    });
  });
});
