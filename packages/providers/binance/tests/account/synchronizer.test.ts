import { describe, expect, it } from 'vitest';
import { InMemorySecretProvider } from '@platform/auth-core';
import { ManualScheduler } from '@platform/http-client';
import {
  BinanceAccountSynchronizer,
  type AccountEventSource,
} from '../../src/account/account-synchronizer';
import {
  BinanceAccountService,
  BinanceBalanceService,
  BinancePositionService,
} from '../../src/account/services';
import { AccountSnapshotManager } from '../../src/account/snapshot-manager';
import { createBinanceProvider } from '../../src/index';
import {
  capabilityContext,
  FakeSocketFactory,
  FakeTransport,
  FixedClock,
  gatewayConfig,
  TEST_SECRETS,
} from '../helpers';
import type {
  BinanceAccountClient,
  BinanceBalanceClient,
  BinancePositionClient,
} from '../../src/account/clients';
import type { BinanceSpotBalance } from '../../src/types/binance';
import type { BalanceUpdatedEvent } from '../../src/auth/events';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A mutable fake balance source so tests can change the snapshot between loads. */
class FakeBalances implements BinanceBalanceClient {
  spot: BinanceSpotBalance[] = [
    { asset: 'BTC', free: '1', locked: '0' },
    { asset: 'USDT', free: '500', locked: '0' },
  ];
  spotBalances(): Promise<readonly BinanceSpotBalance[]> {
    return Promise.resolve(this.spot);
  }
  futuresBalances(): Promise<readonly []> {
    return Promise.resolve([]);
  }
}

const FAKE_ACCOUNT: BinanceAccountClient = {
  account: () =>
    Promise.resolve({
      accountType: 'SPOT',
      canTrade: true,
      permissions: ['SPOT'],
      updateTime: 1000,
      balances: [],
    }),
};
const FAKE_POSITIONS: BinancePositionClient = { positionRisk: () => Promise.resolve([]) };

class FakeEventSource implements AccountEventSource {
  private readonly handlers: Record<string, ((event: never) => void)[]> = {
    accountUpdated: [],
    balanceUpdated: [],
    positionUpdated: [],
  };
  private readonly reconnectHandlers: (() => void)[] = [];
  on(
    kind: 'accountUpdated' | 'balanceUpdated' | 'positionUpdated',
    handler: (event: never) => void,
  ): () => void {
    this.handlers[kind]!.push(handler);
    return () => undefined;
  }
  onReconnect(handler: () => void): () => void {
    this.reconnectHandlers.push(handler);
    return () => undefined;
  }
  emit(kind: 'accountUpdated' | 'balanceUpdated' | 'positionUpdated', event: unknown): void {
    for (const handler of this.handlers[kind]!) (handler as (e: unknown) => void)(event);
  }
  reconnect(): void {
    for (const handler of this.reconnectHandlers) handler();
  }
}

function makeSynchronizer() {
  const clock = new FixedClock(0);
  const balances = new FakeBalances();
  const service = new BinanceAccountService({
    market: 'SPOT',
    accountClient: FAKE_ACCOUNT,
    balanceService: new BinanceBalanceService('SPOT', balances),
    positionService: new BinancePositionService('SPOT', FAKE_POSITIONS),
    clock: clock.now,
  });
  const snapshotManager = new AccountSnapshotManager({ service, clock: clock.now, ttlMs: 0 });
  const source = new FakeEventSource();
  const sync = new BinanceAccountSynchronizer({
    market: 'SPOT',
    brokerId: 'bnc-1',
    snapshotManager,
    eventSource: source,
    clock: clock.now,
  });
  return { sync, source, balances };
}

function delta(asset: string, d: number, eventTime: number): BalanceUpdatedEvent {
  return { kind: 'balanceUpdated', asset, delta: d, clearTime: eventTime, eventTime };
}

describe('BinanceAccountSynchronizer (integration)', () => {
  it('loads the initial snapshot and reaches SYNCHRONIZED', async () => {
    const { sync } = makeSynchronizer();
    await sync.start();
    expect(sync.state).toBe('SYNCHRONIZED');
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(1);
    expect(sync.account().brokerId).toBe('bnc-1');
    expect(sync.syncStatus().state).toBe('SYNCHRONIZED');
  });

  it('applies incremental balance updates and drops duplicates', async () => {
    const { sync, source } = makeSynchronizer();
    await sync.start();
    source.emit('balanceUpdated', delta('BTC', 0.5, 2000));
    source.emit('balanceUpdated', delta('BTC', 0.5, 2000)); // duplicate (same time+key)
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(1.5);
    expect(sync.metricsSnapshot().eventsApplied).toBe(1);
    expect(sync.metricsSnapshot().duplicates).toBe(1);
  });

  it('recovers from a stale (out-of-order) event by reloading the snapshot', async () => {
    const { sync, source, balances } = makeSynchronizer();
    await sync.start();
    source.emit('balanceUpdated', delta('BTC', 1, 3000));
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(2);
    // Change the authoritative snapshot, then send a stale event → triggers snapshot recovery.
    balances.spot = [{ asset: 'BTC', free: '5', locked: '0' }];
    source.emit('balanceUpdated', delta('BTC', 1, 1500)); // stale
    await flush();
    expect(sync.metricsSnapshot().stale).toBe(1);
    expect(sync.metricsSnapshot().recoveries).toBe(1);
    expect(sync.state).toBe('SYNCHRONIZED');
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(5); // reconciled to snapshot
  });

  it('recovers on stream reconnect', async () => {
    const { sync, source, balances } = makeSynchronizer();
    await sync.start();
    balances.spot = [{ asset: 'BTC', free: '9', locked: '0' }];
    source.reconnect();
    await flush();
    expect(sync.metricsSnapshot().recoveries).toBe(1);
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(9);
  });

  it('verify() reconciles when the snapshot diverges from maintained state', async () => {
    const { sync, balances } = makeSynchronizer();
    await sync.start();
    balances.spot = [
      { asset: 'BTC', free: '3', locked: '0' },
      { asset: 'USDT', free: '500', locked: '0' },
    ];
    const report = await sync.verify();
    await flush();
    expect(report.consistent).toBe(false);
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(3);
  });
});

describe('BinanceAccountSynchronizer (contract: provider integration)', () => {
  it('is reachable from the provider and synchronizes over the resilient REST client', async () => {
    const transport = new FakeTransport().on('/api/v3/account', {
      body: {
        accountType: 'SPOT',
        canTrade: true,
        permissions: ['SPOT'],
        updateTime: 1000,
        balances: [{ asset: 'BTC', free: '2', locked: '0' }],
      },
    });
    const provider = createBinanceProvider({
      providerId: 'binance',
      transport,
      socketFactory: new FakeSocketFactory(),
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
      scheduler: new ManualScheduler(),
      clock: new FixedClock(0).now,
    });
    const ctx = capabilityContext(gatewayConfig());
    const sync = provider.accountSynchronizer(ctx);
    await sync.start();
    expect(sync.state).toBe('SYNCHRONIZED');
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(2);
    expect(provider.accountSynchronizer(ctx)).toBe(sync);
  });
});
