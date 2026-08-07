import { describe, expect, it } from 'vitest';
import { AuthenticationEventMapper } from '../../src/auth/event-mapper';
import { AuthenticationValidator } from '../../src/auth/validator';

const resolver = { toCanonical: (v: string) => (v === 'ETHBTC' ? 'ETH-BTC' : v) };
const validator = new AuthenticationValidator();

describe('AuthenticationEventMapper — Spot user data', () => {
  const mapper = new AuthenticationEventMapper('SPOT', resolver);

  it('maps outboundAccountPosition → AccountUpdatedEvent', () => {
    const event = mapper.outboundAccountPosition(
      validator.outboundAccountPosition({
        e: 'outboundAccountPosition',
        E: 1564034571105,
        u: 1564034571073,
        B: [{ a: 'ETH', f: '10000.000000', l: '0.000000' }],
      }),
    );
    expect(event).toMatchObject({
      kind: 'accountUpdated',
      market: 'SPOT',
      balances: [{ asset: 'ETH', free: 10000, locked: 0 }],
      lastUpdateTime: 1564034571073,
    });
  });

  it('maps balanceUpdate → BalanceUpdatedEvent', () => {
    const event = mapper.balanceUpdate(
      validator.balanceUpdate({
        e: 'balanceUpdate',
        E: 1573200697110,
        a: 'BTC',
        d: '100.00000000',
        T: 1573200697068,
      }),
    );
    expect(event).toMatchObject({
      kind: 'balanceUpdated',
      asset: 'BTC',
      delta: 100,
      clearTime: 1573200697068,
    });
  });

  it('maps a filled executionReport → order + report + trade', () => {
    const bundle = mapper.executionReport(
      validator.executionReport({
        e: 'executionReport',
        E: 1499405658658,
        s: 'ETHBTC',
        c: 'mUvoqJxFIILMdfAW5iGSOW',
        S: 'BUY',
        o: 'LIMIT',
        f: 'GTC',
        q: '1.00000000',
        p: '0.10264410',
        P: '0.00000000',
        x: 'TRADE',
        X: 'FILLED',
        r: 'NONE',
        i: 4293153,
        l: '1.00000000',
        z: '1.00000000',
        L: '0.10264410',
        n: '0.00000010',
        N: 'BNB',
        T: 1499405658657,
        t: 1234,
        m: false,
        O: 1499405658650,
        Z: '0.10264410',
      }),
    );
    expect(bundle.order).toMatchObject({
      kind: 'orderUpdated',
      venueOrderId: '4293153',
      symbol: 'ETH-BTC',
      side: 'BUY',
      status: 'FILLED',
      quantity: 1,
      filledQuantity: 1,
    });
    expect(bundle.report).toMatchObject({
      executionType: 'TRADE',
      lastFilledPrice: 0.1026441,
      commission: 0.0000001,
      commissionAsset: 'BNB',
      tradeId: 1234,
    });
    expect(bundle.trade).toMatchObject({
      kind: 'tradeExecution',
      tradeId: 1234,
      price: 0.1026441,
      quantity: 1,
      isMaker: false,
    });
  });

  it('produces no trade for a non-TRADE execution', () => {
    const bundle = mapper.executionReport(
      validator.executionReport({
        e: 'executionReport',
        E: 1,
        s: 'ETHBTC',
        c: 'x',
        S: 'SELL',
        o: 'LIMIT',
        f: 'GTC',
        q: '1',
        p: '1',
        P: '0',
        x: 'NEW',
        X: 'NEW',
        r: 'NONE',
        i: 1,
        l: '0',
        z: '0',
        L: '0',
        n: '0',
        N: null,
        T: 1,
        t: -1,
        m: false,
        O: 1,
        Z: '0',
      }),
    );
    expect(bundle.trade).toBeUndefined();
    expect(bundle.report.executionType).toBe('NEW');
  });
});

describe('AuthenticationEventMapper — Futures user data', () => {
  const mapper = new AuthenticationEventMapper('FUTURES', { toCanonical: (v) => v });

  it('maps ACCOUNT_UPDATE → account + position events', () => {
    const { account, positions } = mapper.futuresAccountUpdate(
      validator.futuresAccountUpdate({
        e: 'ACCOUNT_UPDATE',
        E: 1564745798939,
        T: 1564745798938,
        a: {
          m: 'ORDER',
          B: [{ a: 'USDT', wb: '122624.12', cw: '100.12', bc: '50.12' }],
          P: [
            {
              s: 'BTCUSDT',
              pa: '-0.5',
              ep: '9000',
              cr: '200',
              up: '-10',
              mt: 'cross',
              iw: '0',
              ps: 'BOTH',
            },
          ],
        },
      }),
    );
    expect(account).toMatchObject({
      kind: 'accountUpdated',
      market: 'FUTURES',
      reason: 'ORDER',
      balances: [
        {
          asset: 'USDT',
          walletBalance: 122624.12,
          crossWalletBalance: 100.12,
          balanceChange: 50.12,
        },
      ],
    });
    expect(positions[0]).toMatchObject({
      kind: 'positionUpdated',
      venueSymbol: 'BTCUSDT',
      positionAmount: -0.5,
      entryPrice: 9000,
      unrealizedPnl: -10,
      positionSide: 'BOTH',
    });
  });

  it('maps ORDER_TRADE_UPDATE → order/report/trade with realized pnl', () => {
    const bundle = mapper.futuresOrderTradeUpdate(
      validator.futuresOrderTradeUpdate({
        e: 'ORDER_TRADE_UPDATE',
        E: 1568879465651,
        T: 1568879465650,
        o: {
          s: 'BTCUSDT',
          c: 'TEST',
          S: 'SELL',
          o: 'LIMIT',
          f: 'GTC',
          q: '0.001',
          p: '9910',
          ap: '9910',
          sp: '0',
          x: 'TRADE',
          X: 'FILLED',
          i: 8886774,
          l: '0.001',
          z: '0.001',
          L: '9910',
          n: '0.007',
          N: 'USDT',
          T: 1568879465650,
          t: 31,
          m: false,
          R: false,
          ps: 'LONG',
          rp: '5.5',
        },
      }),
    );
    expect(bundle.order).toMatchObject({
      venueOrderId: '8886774',
      averagePrice: 9910,
      reduceOnly: false,
      positionSide: 'LONG',
    });
    expect(bundle.trade).toMatchObject({ tradeId: 31, price: 9910, realizedPnl: 5.5 });
  });
});

describe('AuthenticationValidator', () => {
  it('rejects malformed payloads and validates recvWindow', () => {
    expect(() => validator.balanceUpdate({ e: 'balanceUpdate', E: 1, a: 'BTC' })).toThrow(
      /field "d"/,
    );
    expect(validator.withinRecvWindow(10_000, 9_800, 5_000)).toBe(true);
    expect(validator.withinRecvWindow(10_000, 3_000, 5_000)).toBe(false); // too old
    expect(validator.withinRecvWindow(10_000, 12_000, 5_000)).toBe(false); // ahead > 1s
  });
});
