/**
 * Phase 9.1.8 — Broker Gateway Contract Verification.
 *
 * Proves the Binance adapter satisfies the canonical `BrokerProviderPort` for BOTH provider ids and
 * that the port's read operations return ONLY canonical Broker Gateway shapes (never a Binance DTO).
 * Covers: capability discovery & truthfulness, the Spot/Futures capability difference, the canonical
 * account-sync reads (positions/balances/orders), health status, and the connectivity lifecycle. This
 * asserts the shape and canonicality of the contract crossing the gateway boundary, over a deterministic
 * fake transport — no live venue.
 */
import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_TYPES,
  describeProvider,
  type BalanceSnapshot,
  type OrderSyncRecord,
  type PositionSnapshot,
} from '@platform/broker-sdk';
import { InMemorySecretProvider } from '@platform/auth-core';
import { createBinanceProvider } from '../../src/index';
import { capabilityContext, FakeTransport, gatewayConfig, TEST_SECRETS } from '../helpers';

const EXCHANGE_INFO = {
  symbols: [{ symbol: 'BTCUSDT', status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT' }],
};
const OPEN_ORDER = {
  symbol: 'BTCUSDT',
  orderId: 7,
  clientOrderId: 'c-7',
  price: '25000',
  origQty: '2',
  executedQty: '0.5',
  status: 'PARTIALLY_FILLED',
  type: 'LIMIT',
  side: 'BUY',
};

function spotTransport(): FakeTransport {
  return new FakeTransport()
    .on('/api/v3/ping', { body: {} })
    .on('/api/v3/time', { body: { serverTime: 0 } })
    .on('/api/v3/exchangeInfo', { body: EXCHANGE_INFO })
    .on('/api/v3/account', {
      body: {
        accountType: 'SPOT',
        canTrade: true,
        balances: [{ asset: 'USDT', free: '900', locked: '100' }],
      },
    })
    .on('/api/v3/openOrders', { body: [OPEN_ORDER] });
}

function futuresTransport(): FakeTransport {
  return new FakeTransport()
    .on('/fapi/v1/ping', { body: {} })
    .on('/fapi/v1/time', { body: { serverTime: 0 } })
    .on('/fapi/v1/exchangeInfo', { body: EXCHANGE_INFO })
    .on('/fapi/v2/balance', { body: [{ asset: 'USDT', balance: '1000', availableBalance: '900' }] })
    .on('/fapi/v2/positionRisk', {
      body: [{ symbol: 'BTCUSDT', positionAmt: '0.3', entryPrice: '25000', positionSide: 'BOTH' }],
    })
    .on('/fapi/v1/openOrders', { body: [OPEN_ORDER] });
}

function provider(providerId: 'binance' | 'binance-futures', transport: FakeTransport) {
  return createBinanceProvider({
    providerId,
    transport,
    secretProvider: new InMemorySecretProvider(TEST_SECRETS),
    clock: () => 0,
  });
}

/** Assert an object's keys are a subset of the allowed canonical key set (no extra venue fields). */
function assertCanonicalKeys(obj: object, allowed: readonly string[]) {
  for (const key of Object.keys(obj)) expect(allowed, `unexpected key "${key}"`).toContain(key);
}

describe('Capability discovery contract', () => {
  it('declares only catalog capabilities, each truthful vs supports()', () => {
    for (const id of ['binance', 'binance-futures'] as const) {
      const p = provider(id, spotTransport());
      const declared = new Set(describeProvider(id).capabilities);
      for (const capability of p.capabilities()) {
        expect(CAPABILITY_TYPES).toContain(capability);
        expect(p.supports(capability)).toBe(true);
        expect(declared.has(capability)).toBe(true);
      }
    }
  });

  it('reflects the Spot/Futures difference: only Futures declares QUERY_POSITIONS', () => {
    expect(provider('binance', spotTransport()).supports('QUERY_POSITIONS')).toBe(false);
    expect(provider('binance-futures', futuresTransport()).supports('QUERY_POSITIONS')).toBe(true);
  });

  it('reports a real (non-placeholder) descriptor for both ids', () => {
    for (const id of ['binance', 'binance-futures'] as const) {
      const p = provider(id, spotTransport());
      expect(p.descriptor.placeholder).toBe(false);
      expect(p.descriptor.id).toBe(id);
    }
  });
});

describe('Account-synchronization read contract returns ONLY canonical shapes', () => {
  const ctx = capabilityContext(gatewayConfig());
  const futuresCtx = capabilityContext(gatewayConfig({ providerId: 'binance-futures' }));

  it('queryBalances → BalanceSnapshot[] (currency/total/available only)', async () => {
    const balances = await provider('binance', spotTransport()).queryBalances(ctx);
    expect(balances.length).toBeGreaterThan(0);
    const sample: BalanceSnapshot = balances[0]!;
    assertCanonicalKeys(sample, ['currency', 'total', 'available']);
    // No Binance field names (free/locked/asset) leak through.
    expect(Object.keys(sample)).not.toContain('free');
    expect(Object.keys(sample)).not.toContain('asset');
  });

  it('queryOrders → OrderSyncRecord[] (canonical keys, no origQty/cummulative*)', async () => {
    const orders = await provider('binance', spotTransport()).queryOrders(ctx);
    const sample: OrderSyncRecord = orders[0]!;
    assertCanonicalKeys(sample, [
      'brokerOrderId',
      'clientOrderId',
      'symbol',
      'status',
      'filledQuantity',
      'remainingQuantity',
    ]);
    expect(Object.keys(sample)).not.toContain('origQty');
    expect(Object.keys(sample)).not.toContain('executedQty');
  });

  it('queryPositions → PositionSnapshot[] on Futures (canonical keys, no positionAmt)', async () => {
    const positions = await provider('binance-futures', futuresTransport()).queryPositions(
      futuresCtx,
    );
    expect(positions.length).toBeGreaterThan(0);
    const sample: PositionSnapshot = positions[0]!;
    assertCanonicalKeys(sample, ['symbol', 'quantity', 'averagePrice', 'assetClass']);
    expect(Object.keys(sample)).not.toContain('positionAmt');
  });

  it('queryPositions → empty on Spot (no derivatives position book)', async () => {
    expect(await provider('binance', spotTransport()).queryPositions(ctx)).toEqual([]);
  });
});

describe('Connectivity & health contract', () => {
  const ctx = capabilityContext(gatewayConfig());

  it('authenticate → connect → heartbeat → disconnect resolve with canonical results', async () => {
    const p = provider('binance', spotTransport());
    const auth = await p.authenticate(ctx);
    expect(auth.tokenRef).toBe('secret://brokers/bnc-1');
    await expect(p.connect(ctx)).resolves.toBeUndefined();
    const beat = await p.heartbeat(ctx);
    assertCanonicalKeys(beat, ['at', 'latencyMs']);
    await expect(p.disconnect(ctx)).resolves.toBeUndefined();
  });

  it('health() returns a canonical BrokerHealth for the binding', async () => {
    const p = provider('binance', spotTransport());
    await p.connect(ctx);
    const health = p.health(ctx, 'HEALTHY');
    assertCanonicalKeys(health, [
      'brokerId',
      'level',
      'score',
      'heartbeatAgeMs',
      'latencyMs',
      'errorRate',
      'checks',
      'evaluatedAt',
    ]);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'OFFLINE']).toContain(health.level);
  });

  it('fails closed (canonical config error) when credentials are missing', async () => {
    const p = createBinanceProvider({
      providerId: 'binance',
      transport: spotTransport(),
      secretProvider: new InMemorySecretProvider({}),
      clock: () => 0,
    });
    await expect(p.authenticate(ctx)).rejects.toMatchObject({ category: 'CONFIGURATION' });
  });
});
