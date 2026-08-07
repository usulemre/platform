/**
 * Contract conformance: the Binance adapter MUST satisfy the Broker Gateway SDK's `BrokerProviderPort`
 * exactly as the gateway expects, and the package MUST keep the composition seam (`providerFactories`)
 * the broker-gateway service depends on. These tests assert the *shape of the contract*, not venue
 * behaviour, so they hold for both provider ids without any live transport.
 */
import { describe, expect, it } from 'vitest';
import { CAPABILITY_TYPES, describeProvider, type BrokerProviderPort } from '@platform/broker-sdk';
import { InMemorySecretProvider } from '@platform/auth-core';
import {
  createBinanceProvider,
  providerFactories,
  PROVIDER_IDS,
  PROVIDER_DESCRIPTORS,
} from '../../src/index';
import { capabilityContext, FakeTransport, gatewayConfig, TEST_SECRETS } from '../helpers';

const PORT_METHODS: (keyof BrokerProviderPort)[] = [
  'capabilities',
  'supports',
  'authenticate',
  'connect',
  'disconnect',
  'heartbeat',
  'queryPositions',
  'queryBalances',
  'queryOrders',
];

describe('BrokerProviderPort contract conformance', () => {
  it('exposes both provider ids and their canonical descriptors', () => {
    expect([...PROVIDER_IDS]).toEqual(['binance', 'binance-futures']);
    expect(PROVIDER_DESCRIPTORS.map((d) => d.id)).toEqual(['binance', 'binance-futures']);
  });

  it('supplies zero-argument composition factories for the gateway registry', () => {
    expect(Object.keys(providerFactories).sort()).toEqual(['binance', 'binance-futures']);
    for (const [id, factory] of Object.entries(providerFactories)) {
      const provider = factory();
      expect(provider.descriptor.id).toBe(id);
      for (const method of PORT_METHODS) expect(typeof provider[method]).toBe('function');
    }
  });

  it('only declares capabilities that exist in the canonical catalog and are truthful vs supports()', () => {
    const provider = createBinanceProvider({ providerId: 'binance' });
    for (const capability of provider.capabilities()) {
      expect(CAPABILITY_TYPES).toContain(capability);
      expect(provider.supports(capability)).toBe(true);
    }
    // Declared capabilities are a subset of the descriptor's declared set.
    const declared = new Set(describeProvider('binance').capabilities);
    for (const capability of provider.capabilities()) expect(declared.has(capability)).toBe(true);
  });

  it('resolves the port operations for a configured broker binding', async () => {
    const transport = new FakeTransport()
      .on('/api/v3/ping', { body: {} })
      .on('/api/v3/time', { body: { serverTime: 0 } });
    const provider = createBinanceProvider({
      providerId: 'binance',
      transport,
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
      clock: () => 0,
    });
    const ctx = capabilityContext(gatewayConfig());
    const auth = await provider.authenticate(ctx);
    expect(auth.tokenRef).toBe('secret://brokers/bnc-1');
    await expect(provider.heartbeat(ctx)).resolves.toMatchObject({ latencyMs: expect.any(Number) });
    await expect(provider.disconnect(ctx)).resolves.toBeUndefined();
  });
});
