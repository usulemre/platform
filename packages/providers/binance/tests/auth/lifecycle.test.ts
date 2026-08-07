import { describe, expect, it, vi } from 'vitest';
import { ManualScheduler } from '@platform/http-client';
import { InMemorySecretProvider } from '@platform/auth-core';
import { ListenKeyManager, LISTEN_KEY_VALIDITY_MS } from '../../src/auth/listen-key-manager';
import { ListenKeyRefresher } from '../../src/auth/listen-key-refresher';
import { AuthenticationStateManager } from '../../src/auth/state';
import { ServerTimeSynchronizer } from '../../src/auth/clock';
import { RequestSigner } from '../../src/auth/signer';
import { BinanceAuthentication } from '../../src/auth/authentication';
import { resolveBinanceConfiguration } from '../../src/config';
import { FixedClock, gatewayConfig, TEST_SECRETS } from '../helpers';
import type { AuthenticatedRestClient } from '../../src/auth/rest';

function fakeRest(overrides: Partial<AuthenticatedRestClient> = {}): AuthenticatedRestClient & {
  keepAlives: number;
  closes: number;
  keys: string[];
} {
  let counter = 0;
  const state = { keepAlives: 0, closes: 0, keys: [] as string[] };
  return {
    serverTime: () => Promise.resolve({ serverTime: 6_000 }),
    createListenKey: () => {
      const key = `key-${(counter += 1)}`;
      state.keys.push(key);
      return Promise.resolve(key);
    },
    keepAliveListenKey: () => {
      state.keepAlives += 1;
      return Promise.resolve();
    },
    closeListenKey: () => {
      state.closes += 1;
      return Promise.resolve();
    },
    account: () => Promise.resolve({ balances: [] }),
    ...overrides,
    ...state,
  } as AuthenticatedRestClient & { keepAlives: number; closes: number; keys: string[] };
}

describe('ListenKeyManager', () => {
  it('creates, keeps alive (extends validity) and detects expiry', async () => {
    const clock = new FixedClock(0);
    const rest = fakeRest();
    const manager = new ListenKeyManager({ rest, clock: clock.now });
    const key = await manager.create();
    expect(key).toBe('key-1');
    expect(manager.expiryAt).toBe(LISTEN_KEY_VALIDITY_MS);
    expect(manager.isExpired()).toBe(false);

    clock.advance(LISTEN_KEY_VALIDITY_MS - 1);
    await manager.keepAlive();
    expect(manager.expiryAt).toBe(clock.now() + LISTEN_KEY_VALIDITY_MS);

    clock.advance(LISTEN_KEY_VALIDITY_MS);
    expect(manager.isExpired()).toBe(true);
    manager.markExpired();
    expect(manager.key).toBeUndefined();
  });
});

describe('ListenKeyRefresher', () => {
  it('keeps the key alive on each scheduled tick', async () => {
    const clock = new FixedClock(0);
    const rest = fakeRest();
    const scheduler = new ManualScheduler();
    const manager = new ListenKeyManager({ rest, clock: clock.now });
    await manager.create();
    const onKeepAlive = vi.fn();
    const refresher = new ListenKeyRefresher({
      manager,
      scheduler,
      intervalMs: 1000,
      callbacks: { onKeepAlive },
    });
    refresher.start();
    await scheduler.advance(1000);
    await Promise.resolve();
    expect(onKeepAlive).toHaveBeenCalledTimes(1);
    refresher.stop();
  });

  it('recreates the key when keep-alive fails', async () => {
    const clock = new FixedClock(0);
    const rest = fakeRest({ keepAliveListenKey: () => Promise.reject(new Error('expired')) });
    const scheduler = new ManualScheduler();
    const manager = new ListenKeyManager({ rest, clock: clock.now });
    await manager.create();
    const onRecreate = vi.fn();
    const refresher = new ListenKeyRefresher({ manager, scheduler, callbacks: { onRecreate } });
    const key = await refresher.refreshOnce();
    expect(key).toBe('key-2');
    expect(onRecreate).toHaveBeenCalledWith('key-2');
  });
});

describe('AuthenticationStateManager', () => {
  it('permits only defined transitions and emits change events', () => {
    const changes: string[] = [];
    const manager = new AuthenticationStateManager({
      clock: () => 1,
      onChange: (e) => changes.push(`${e.previous}->${e.current}`),
    });
    expect(manager.transition('AUTHENTICATED', 'x')).toBeNull(); // not allowed from UNAUTHENTICATED
    manager.transition('AUTHENTICATING', 'start');
    manager.transition('AUTHENTICATED', 'ready');
    expect(manager.isAuthenticated).toBe(true);
    manager.transition('EXPIRED', 'expiry');
    expect(changes).toEqual([
      'UNAUTHENTICATED->AUTHENTICATING',
      'AUTHENTICATING->AUTHENTICATED',
      'AUTHENTICATED->EXPIRED',
    ]);
  });
});

describe('ServerTimeSynchronizer + RequestSigner', () => {
  const config = resolveBinanceConfiguration(gatewayConfig());

  it('synchronizes the clock and signs with a server-aligned timestamp', async () => {
    const clock = new FixedClock(1_000);
    const sync = new ServerTimeSynchronizer({
      clock: clock.now,
      source: () => Promise.resolve({ serverTime: 6_000 }),
      ttlMs: 60_000,
    });
    await sync.synchronize();
    expect(sync.offsetMs).toBe(5_000);
    expect(sync.now()).toBe(6_000);

    const auth = new BinanceAuthentication({
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
    });
    const signer = new RequestSigner(auth, config, sync.clock);
    expect(signer.isConfigured()).toBe(true);
    const signed = signer.signParams({ symbol: 'BTCUSDT' });
    expect(signed).toContain('timestamp=6000');
    expect(signed).toMatch(/signature=[0-9a-f]{64}$/);
    expect(signer.authHeaders()['X-MBX-APIKEY']).toBe('test-api-key');
  });
});
