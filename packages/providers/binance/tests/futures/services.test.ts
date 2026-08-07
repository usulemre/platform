/**
 * Unit tests for the USDⓈ-M Futures services — order lifecycle, position & risk configuration
 * (leverage / margin type / position mode / isolated margin), account/balance reads, position-mode
 * validation differences, and canonical error mapping (invalid requests, invalid responses, API
 * errors). All venue IO is faked; behaviour is deterministic.
 */
import { describe, expect, it } from 'vitest';
import { BinanceFuturesOrderService } from '../../src/futures/order-service';
import { BinanceFuturesPositionService } from '../../src/futures/position-service';
import { BinanceFuturesAccountService } from '../../src/futures/account-service';
import { BinanceFuturesBalanceService } from '../../src/futures/balance-service';
import { BinanceFuturesMetadataService } from '../../src/futures/metadata-service';
import { BinanceApiError } from '../../src/errors';
import type {
  BinanceParamRecord,
  FuturesAccountClient,
  FuturesConfigClient,
  FuturesMarketDataClient,
  FuturesTradingClient,
  OrderRef,
} from '../../src/futures/client';
import type {
  BinanceCodeMsg,
  BinanceFundingRate,
  BinanceFuturesAccountInfo,
  BinanceFuturesAck,
  BinanceFuturesBalance,
  BinanceLeverageBracket,
  BinanceLeverageResponse,
  BinanceOrder,
  BinancePositionMarginResponse,
  BinancePositionRisk,
  BinancePositionSideDual,
  BinancePremiumIndex,
  BinanceUserTrade,
} from '../../src/types/binance';
import type { FuturesPositionMode } from '../../src/futures/types';

const ORDER: BinanceOrder = {
  symbol: 'BTCUSDT',
  orderId: 10,
  clientOrderId: 'c-10',
  price: '25000',
  origQty: '1',
  executedQty: '0',
  status: 'NEW',
  type: 'LIMIT',
  side: 'BUY',
  positionSide: 'BOTH',
  updateTime: 1,
};

class FakeTradingClient implements FuturesTradingClient {
  lastCreate?: BinanceParamRecord;
  createError?: Error;
  createOrder(params: BinanceParamRecord): Promise<BinanceOrder> {
    this.lastCreate = params;
    if (this.createError) return Promise.reject(this.createError);
    return Promise.resolve(ORDER);
  }
  queryOrder(_s: string, _r: OrderRef): Promise<BinanceOrder> {
    return Promise.resolve(ORDER);
  }
  cancelOrder(_s: string, _r: OrderRef): Promise<BinanceOrder> {
    return Promise.resolve({ ...ORDER, status: 'CANCELED' });
  }
  cancelAllOrders(_s: string): Promise<BinanceFuturesAck> {
    return Promise.resolve({ code: 200, msg: 'success' });
  }
  modifyOrder(_p: BinanceParamRecord): Promise<BinanceOrder> {
    return Promise.resolve({ ...ORDER, price: '25100' });
  }
  openOrders(_s?: string): Promise<readonly BinanceOrder[]> {
    return Promise.resolve([ORDER]);
  }
  userTrades(_s: string): Promise<readonly BinanceUserTrade[]> {
    const t: BinanceUserTrade = {
      id: 1,
      orderId: 10,
      symbol: 'BTCUSDT',
      price: '25000',
      qty: '1',
      commission: '0.5',
      commissionAsset: 'USDT',
      isBuyer: true,
      isMaker: false,
      time: 1,
    };
    return Promise.resolve([t]);
  }
}

class FakeAccountClient implements FuturesAccountClient {
  positions: readonly BinancePositionRisk[] = [
    { symbol: 'BTCUSDT', positionAmt: '0.5', entryPrice: '25000', marginType: 'cross' },
    { symbol: 'ETHUSDT', positionAmt: '0', entryPrice: '0' },
  ];
  account(): Promise<BinanceFuturesAccountInfo> {
    return Promise.resolve({
      canTrade: true,
      totalWalletBalance: '1000',
      availableBalance: '900',
      assets: [{ asset: 'USDT', walletBalance: '1000', availableBalance: '900' }],
      positions: [],
    });
  }
  balances(): Promise<readonly BinanceFuturesBalance[]> {
    const b: BinanceFuturesBalance[] = [
      { asset: 'USDT', balance: '1000', availableBalance: '900' },
      { asset: 'BNB', balance: '0', availableBalance: '0' },
    ];
    return Promise.resolve(b);
  }
  positionRisk(_s?: string): Promise<readonly BinancePositionRisk[]> {
    return Promise.resolve(this.positions);
  }
}

class FakeConfigClient implements FuturesConfigClient {
  dual = false;
  lastLeverage?: number;
  lastMarginType?: string;
  setLeverage(_s: string, leverage: number): Promise<BinanceLeverageResponse> {
    this.lastLeverage = leverage;
    return Promise.resolve({ leverage, maxNotionalValue: '1000000', symbol: 'BTCUSDT' });
  }
  setMarginType(_s: string, marginType: string): Promise<BinanceCodeMsg> {
    this.lastMarginType = marginType;
    return Promise.resolve({ code: 200, msg: 'success' });
  }
  modifyPositionMargin(_p: BinanceParamRecord): Promise<BinancePositionMarginResponse> {
    return Promise.resolve({ amount: 100, code: 200, msg: 'ok', type: 1 });
  }
  getPositionMode(): Promise<BinancePositionSideDual> {
    return Promise.resolve({ dualSidePosition: this.dual });
  }
  setPositionMode(dual: boolean): Promise<BinanceCodeMsg> {
    this.dual = dual;
    return Promise.resolve({ code: 200, msg: 'success' });
  }
  leverageBracket(_s?: string): Promise<readonly BinanceLeverageBracket[]> {
    return Promise.resolve([
      {
        symbol: 'BTCUSDT',
        brackets: [
          {
            bracket: 1,
            initialLeverage: 125,
            notionalCap: 50000,
            notionalFloor: 0,
            maintMarginRatio: 0.004,
          },
        ],
      },
    ]);
  }
}

class FakeMarketDataClient implements FuturesMarketDataClient {
  premiumIndex(
    venueSymbol?: string,
  ): Promise<BinancePremiumIndex | readonly BinancePremiumIndex[]> {
    const one: BinancePremiumIndex = {
      symbol: 'BTCUSDT',
      markPrice: '25000',
      lastFundingRate: '0.0001',
    };
    return Promise.resolve(venueSymbol ? one : [one]);
  }
  fundingRateHistory(_s?: string, _l?: number): Promise<readonly BinanceFundingRate[]> {
    return Promise.resolve([{ symbol: 'BTCUSDT', fundingRate: '0.0001', fundingTime: 1 }]);
  }
}

const RESOLVER = { toCanonical: (s: string) => (s === 'BTCUSDT' ? 'BTC-USDT' : s) };

describe('BinanceFuturesOrderService — lifecycle', () => {
  function service(mode: FuturesPositionMode = 'ONE_WAY', client = new FakeTradingClient()) {
    return {
      client,
      svc: new BinanceFuturesOrderService({ client, positionMode: () => mode, clock: () => 0 }),
    };
  }

  it('creates, queries, cancels, modifies and lists orders', async () => {
    const { svc } = service();
    const created = await svc.createOrder({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
    });
    expect(created.order.status).toBe('NEW');
    expect(created.fills).toEqual([]);
    expect((await svc.getOrder('BTC-USDT', { orderId: 10 })).venueOrderId).toBe('10');
    expect((await svc.cancelOrder('BTC-USDT', { orderId: 10 })).status).toBe('CANCELED');
    expect((await svc.cancelAllOrders('BTC-USDT')).acknowledged).toBe(true);
    expect(
      (
        await svc.modifyOrder({
          symbol: 'BTC-USDT',
          side: 'BUY',
          quantity: 1,
          price: 25100,
          reference: { orderId: 10 },
        })
      ).order.price,
    ).toBe(25100);
    expect(await svc.listOpenOrders('BTC-USDT')).toHaveLength(1);
    expect(await svc.listFills('BTC-USDT')).toHaveLength(1);
    expect(svc.metricsSnapshot().orders).toBeGreaterThan(0);
  });

  it('rejects an order with no quantity (invalid request)', async () => {
    const { svc } = service();
    await expect(
      svc.createOrder({ symbol: 'BTC-USDT', side: 'BUY', type: 'MARKET', quantity: 0 }),
    ).rejects.toMatchObject({ category: 'VALIDATION' });
  });

  it('enforces hedge-mode position side differences', async () => {
    const hedge = service('HEDGE');
    await expect(
      hedge.svc.createOrder({ symbol: 'BTC-USDT', side: 'BUY', type: 'MARKET', quantity: 1 }),
    ).rejects.toMatchObject({ category: 'VALIDATION' });
    // With an explicit LONG side it passes validation.
    const ok = await hedge.svc.createOrder({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 1,
      positionSide: 'LONG',
    });
    expect(ok.order.venueOrderId).toBe('10');
  });

  it('rejects positionSide BOTH omission in one-way when LONG supplied', async () => {
    const { svc } = service('ONE_WAY');
    await expect(
      svc.createOrder({
        symbol: 'BTC-USDT',
        side: 'BUY',
        type: 'MARKET',
        quantity: 1,
        positionSide: 'LONG',
      }),
    ).rejects.toMatchObject({ category: 'VALIDATION' });
  });

  it('maps a venue API error to a canonical order error', async () => {
    const client = new FakeTradingClient();
    client.createError = new BinanceApiError(
      -2019,
      'Margin is insufficient.',
      400,
      'ORDER_REJECTED',
      false,
    );
    const { svc } = service('ONE_WAY', client);
    await expect(
      svc.createOrder({ symbol: 'BTC-USDT', side: 'BUY', type: 'MARKET', quantity: 1 }),
    ).rejects.toMatchObject({ category: 'INSUFFICIENT_BALANCE', venueCode: -2019 });
  });

  it('rejects an invalid (non-order) venue response', async () => {
    const client = new FakeTradingClient();
    client.createOrder = () => Promise.resolve({} as BinanceOrder);
    const { svc } = service('ONE_WAY', client);
    await expect(
      svc.createOrder({ symbol: 'BTC-USDT', side: 'BUY', type: 'MARKET', quantity: 1 }),
    ).rejects.toMatchObject({ category: 'VALIDATION' });
  });
});

describe('BinanceFuturesPositionService — positions & risk configuration', () => {
  function build() {
    const accountClient = new FakeAccountClient();
    const configClient = new FakeConfigClient();
    const svc = new BinanceFuturesPositionService({
      accountClient,
      configClient,
      resolver: RESOLVER,
      clock: () => 0,
    });
    return { accountClient, configClient, svc };
  }

  it('reads open positions and drops flat ones', async () => {
    const { svc } = build();
    const positions = await svc.getPositions();
    expect(positions).toHaveLength(1);
    expect(positions[0]!.symbol).toBe('BTC-USDT');
    expect(positions[0]!.marginType).toBe('CROSSED');
  });

  it('sets leverage after validating the range', async () => {
    const { svc, configClient } = build();
    const result = await svc.setLeverage('BTC-USDT', 10);
    expect(result.leverage).toBe(10);
    expect(configClient.lastLeverage).toBe(10);
    await expect(svc.setLeverage('BTC-USDT', 0)).rejects.toMatchObject({
      category: 'INVALID_REQUEST',
    });
    await expect(svc.setLeverage('BTC-USDT', 200)).rejects.toBeTruthy();
  });

  it('sets margin type differences (ISOLATED vs CROSSED)', async () => {
    const { svc, configClient } = build();
    expect((await svc.setMarginType('BTC-USDT', 'ISOLATED')).marginType).toBe('ISOLATED');
    expect(configClient.lastMarginType).toBe('ISOLATED');
    expect((await svc.setMarginType('BTC-USDT', 'CROSSED')).acknowledged).toBe(true);
  });

  it('reads and changes position mode, caching it for order validation', async () => {
    const { svc } = build();
    expect(svc.positionMode()).toBe('ONE_WAY');
    expect((await svc.getPositionMode()).mode).toBe('ONE_WAY');
    expect((await svc.setPositionMode('HEDGE')).mode).toBe('HEDGE');
    expect(svc.positionMode()).toBe('HEDGE');
  });

  it('modifies isolated position margin (validated positive)', async () => {
    const { svc } = build();
    expect((await svc.modifyPositionMargin('BTC-USDT', 100, 'ADD', 'LONG')).acknowledged).toBe(
      true,
    );
    await expect(svc.modifyPositionMargin('BTC-USDT', -5, 'ADD')).rejects.toBeTruthy();
  });
});

describe('BinanceFuturesAccountService / BalanceService / MetadataService', () => {
  it('reads the canonical account', async () => {
    const svc = new BinanceFuturesAccountService({
      client: new FakeAccountClient(),
      resolver: RESOLVER,
    });
    const account = await svc.getAccount();
    expect(account.canTrade).toBe(true);
    expect(account.assets[0]!.asset).toBe('USDT');
  });

  it('reads wallet balances and can drop zero balances', async () => {
    const svc = new BinanceFuturesBalanceService({ client: new FakeAccountClient() });
    expect(await svc.getBalances()).toHaveLength(2);
    expect(await svc.getBalances(true)).toHaveLength(1);
  });

  it('reads mark price, funding and leverage brackets', async () => {
    const svc = new BinanceFuturesMetadataService({
      marketDataClient: new FakeMarketDataClient(),
      configClient: new FakeConfigClient(),
      resolver: RESOLVER,
    });
    expect((await svc.markPrice('BTC-USDT')).markPrice).toBe(25000);
    expect(await svc.markPrices()).toHaveLength(1);
    expect((await svc.fundingRates('BTC-USDT'))[0]!.fundingRate).toBe(0.0001);
    expect((await svc.leverageBrackets('BTC-USDT'))[0]!.brackets[0]!.initialLeverage).toBe(125);
  });
});
