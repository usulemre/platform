import { describe, expect, it } from 'vitest';
import { BinanceServerTimeSync } from '../../src/time-sync';
import { BinanceExchangeInfoCache } from '../../src/exchange-info';
import { BinanceHealthMonitor } from '../../src/health-monitor';
import { BinanceCapabilityRegistry } from '../../src/capability-registry';
import { FixedClock } from '../helpers';
import type { BinanceExchangeInfo } from '../../src/types/binance';

describe('BinanceServerTimeSync', () => {
  it('computes an offset from server time and applies it to now()', async () => {
    const clock = new FixedClock(1_000);
    const sync = new BinanceServerTimeSync({ clock: clock.now, ttlMs: 60_000 });
    expect(sync.now()).toBe(1_000);
    await sync.sync(() => Promise.resolve({ serverTime: 6_000 }));
    expect(sync.offset).toBe(5_000);
    expect(sync.now()).toBe(6_000);
    expect(sync.isFresh()).toBe(true);
  });

  it('re-syncs only when stale', async () => {
    const clock = new FixedClock(0);
    const sync = new BinanceServerTimeSync({ clock: clock.now, ttlMs: 1_000 });
    let calls = 0;
    const fetch = () => {
      calls += 1;
      return Promise.resolve({ serverTime: clock.now() });
    };
    await sync.ensureFresh(fetch);
    await sync.ensureFresh(fetch);
    expect(calls).toBe(1);
    clock.advance(2_000);
    await sync.ensureFresh(fetch);
    expect(calls).toBe(2);
  });
});

describe('BinanceExchangeInfoCache', () => {
  const info: BinanceExchangeInfo = {
    symbols: [
      { symbol: 'BTCUSDT', status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT' },
      { symbol: 'ETHUSDT', status: 'TRADING', baseAsset: 'ETH', quoteAsset: 'USDT' },
    ],
  };

  it('loads on ensure, serves lookups, and honours TTL', async () => {
    const clock = new FixedClock(0);
    const cache = new BinanceExchangeInfoCache({ clock: clock.now, ttlMs: 1_000 });
    let calls = 0;
    const fetch = () => {
      calls += 1;
      return Promise.resolve(info);
    };
    await cache.ensure(fetch);
    await cache.ensure(fetch);
    expect(calls).toBe(1);
    expect(cache.size).toBe(2);
    expect(cache.get('btcusdt')?.baseAsset).toBe('BTC');
    clock.advance(2_000);
    await cache.ensure(fetch);
    expect(calls).toBe(2);
  });
});

describe('BinanceHealthMonitor', () => {
  it('tracks error rate and computes canonical health', () => {
    const clock = new FixedClock(0);
    const monitor = new BinanceHealthMonitor({
      brokerId: 'bnc-1',
      clock: clock.now,
      heartbeatIntervalMs: 1_000,
    });
    monitor.recordHeartbeat(20);
    monitor.recordSuccess(10);
    monitor.recordError();
    expect(monitor.errorRate).toBeCloseTo(1 / 3);
    const health = monitor.snapshot('HEALTHY');
    expect(health.brokerId).toBe('bnc-1');
    expect(health.latencyMs).toBe(10);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(health.level);
  });

  it('reports OFFLINE for a disconnected broker', () => {
    const monitor = new BinanceHealthMonitor({
      brokerId: 'bnc-1',
      clock: () => 0,
      heartbeatIntervalMs: 1_000,
    });
    expect(monitor.snapshot('DISCONNECTED').level).toBe('OFFLINE');
  });
});

describe('BinanceCapabilityRegistry', () => {
  it('declares trading + heartbeat and drops positions on spot', () => {
    const spot = new BinanceCapabilityRegistry('binance');
    expect(spot.market).toBe('SPOT');
    expect(spot.supports('SUBMIT_ORDER')).toBe(true);
    expect(spot.supports('QUERY_POSITIONS')).toBe(false);
  });

  it('keeps positions on futures', () => {
    const futures = new BinanceCapabilityRegistry('binance-futures');
    expect(futures.market).toBe('FUTURES');
    expect(futures.supports('QUERY_POSITIONS')).toBe(true);
    expect(futures.describe().length).toBe(futures.list().length);
  });
});
