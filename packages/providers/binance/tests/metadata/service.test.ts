import { describe, expect, it, vi } from 'vitest';
import { InMemorySecretProvider } from '@platform/auth-core';
import { ExchangeMetadataService, createExchangeMetadataService } from '../../src/metadata/service';
import { BinanceMetadataError } from '../../src/metadata/errors';
import type { ExchangeMetadataSource, MetadataMonitor } from '../../src/metadata/refresher';
import { createBinanceProvider } from '../../src/index';
import {
  capabilityContext,
  FakeTransport,
  FixedClock,
  gatewayConfig,
  TEST_SECRETS,
} from '../helpers';
import { SPOT_EXCHANGE_INFO } from './fixtures';
import type { BinanceExchangeInfo } from '../../src/types/binance';

/** A fake metadata source that records fetch calls and can be scripted per call. */
class FakeSource implements ExchangeMetadataSource {
  calls = 0;
  constructor(private payload: BinanceExchangeInfo = SPOT_EXCHANGE_INFO) {}
  exchangeInfo(): Promise<BinanceExchangeInfo> {
    this.calls += 1;
    return Promise.resolve(this.payload);
  }
  setPayload(payload: BinanceExchangeInfo): void {
    this.payload = payload;
  }
}

describe('ExchangeMetadataService (integration)', () => {
  it('discovers, validates, caches and exposes canonical metadata + registries', async () => {
    const source = new FakeSource();
    const service = createExchangeMetadataService({ market: 'SPOT', source, clock: () => 0 });

    expect(service.metadata()).toBeUndefined();
    const metadata = await service.ensureFresh();
    expect(metadata.source).toBe('binance');
    expect(service.symbols().size).toBe(3);
    expect(service.pairs().byQuoteAsset('USDT')).toHaveLength(2);
    expect(service.assets().has('BTC')).toBe(true);
    expect(service.capabilities().supportsPermission('MARGIN')).toBe(true);
    expect(service.getSymbol('btcusdt')?.symbol).toBe('BTC-USDT');
    expect(service.rateLimits()[0]?.limit).toBe(1200);
    expect(service.serverTime()).toBe(1_700_000_000_000);
    expect(service.timezone()).toBe('UTC');
  });

  it('caches within TTL and re-discovers when stale', async () => {
    const clock = new FixedClock(0);
    const source = new FakeSource();
    const service = createExchangeMetadataService({
      market: 'SPOT',
      source,
      clock: clock.now,
      ttlMs: 1_000,
    });
    await service.ensureFresh();
    await service.ensureFresh();
    expect(source.calls).toBe(1);
    clock.advance(2_000);
    await service.ensureFresh();
    expect(source.calls).toBe(2);
    // refresh() always re-fetches.
    await service.refresh();
    expect(source.calls).toBe(3);
  });

  it('rebuilds registries after a refresh changes the snapshot', async () => {
    const source = new FakeSource();
    const service = createExchangeMetadataService({ market: 'SPOT', source, clock: () => 0 });
    await service.refresh();
    const before = service.symbols();
    source.setPayload({ ...SPOT_EXCHANGE_INFO, symbols: [SPOT_EXCHANGE_INFO.symbols[0]!] });
    await service.refresh();
    const after = service.symbols();
    expect(after).not.toBe(before);
    expect(after.size).toBe(1);
  });

  it('throws a BinanceMetadataError and notifies the monitor on invalid metadata', async () => {
    const monitor: MetadataMonitor = { onValidationFailed: vi.fn(), onRefreshed: vi.fn() };
    const source = new FakeSource({ symbols: [] });
    const service = createExchangeMetadataService({
      market: 'SPOT',
      source,
      clock: () => 0,
      monitor,
    });
    await expect(service.refresh()).rejects.toBeInstanceOf(BinanceMetadataError);
    expect(monitor.onValidationFailed).toHaveBeenCalledWith('raw', expect.any(Array));
  });

  it('reports validate() before any discovery', () => {
    const service = createExchangeMetadataService({ market: 'SPOT', source: new FakeSource() });
    expect(service.validate().valid).toBe(false);
    expect(() => service.symbols()).toThrow();
  });
});

describe('ExchangeMetadataService (contract: real REST client as source)', () => {
  it('BinanceRestClient satisfies ExchangeMetadataSource and drives discovery end-to-end', async () => {
    const transport = new FakeTransport().on('/api/v3/exchangeInfo', { body: SPOT_EXCHANGE_INFO });
    const provider = createBinanceProvider({
      providerId: 'binance',
      transport,
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
      clock: new FixedClock(0).now,
    });
    const ctx = capabilityContext(gatewayConfig());

    const service: ExchangeMetadataService = provider.metadataService(ctx);
    const metadata = await service.ensureFresh();
    expect(metadata.symbols.map((s) => s.venueSymbol).sort()).toEqual([
      'BTCUSDT',
      'ETHBTC',
      'LUNAUSDT',
    ]);
    // Memoized per broker runtime.
    expect(provider.metadataService(ctx)).toBe(service);
    expect(transport.lastRequest('/api/v3/exchangeInfo')).toBeDefined();
  });
});
