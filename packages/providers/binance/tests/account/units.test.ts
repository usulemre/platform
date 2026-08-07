import { describe, expect, it } from 'vitest';
import { SynchronizationStateMachine } from '../../src/account/state-machine';
import { SequenceValidator } from '../../src/account/sequence-validator';
import { BinanceBalanceSynchronizer } from '../../src/account/balance-synchronizer';
import { BinancePositionSynchronizer } from '../../src/account/position-synchronizer';
import { EventProcessor } from '../../src/account/event-processor';
import { StateReconciler } from '../../src/account/reconciler';
import { BalanceMapper, PositionMapper } from '../../src/account/mappers';
import { AccountValidator } from '../../src/account/validators';
import type { AccountBalance, AccountPosition, AccountState } from '../../src/account/canonical';
import type {
  AccountUpdatedEvent,
  BalanceUpdatedEvent,
  PositionUpdatedEvent,
} from '../../src/auth/events';

describe('SynchronizationStateMachine', () => {
  it('permits only defined transitions', () => {
    const sm = new SynchronizationStateMachine({ clock: () => 1 });
    expect(sm.transition('SYNCHRONIZED', 'x')).toBeNull();
    expect(sm.transition('INITIALIZING', 'start')?.current).toBe('INITIALIZING');
    expect(sm.transition('SNAPSHOT_LOADING', 'snap')?.current).toBe('SNAPSHOT_LOADING');
    expect(sm.transition('SYNCHRONIZING', 'sync')?.current).toBe('SYNCHRONIZING');
    expect(sm.transition('SYNCHRONIZED', 'live')?.current).toBe('SYNCHRONIZED');
    expect(sm.transition('DEGRADED', 'gap')?.current).toBe('DEGRADED');
    expect(sm.transition('RECOVERING', 'recover')?.current).toBe('RECOVERING');
  });
});

describe('SequenceValidator', () => {
  it('accepts in-order, drops duplicates and stale events', () => {
    const seq = new SequenceValidator();
    expect(seq.check({ eventTime: 100, key: 'balance:BTC' })).toBe('ok');
    expect(seq.check({ eventTime: 100, key: 'balance:ETH' })).toBe('ok'); // same time, different key
    expect(seq.check({ eventTime: 100, key: 'balance:BTC' })).toBe('duplicate');
    expect(seq.check({ eventTime: 200, key: 'balance:BTC' })).toBe('ok');
    expect(seq.check({ eventTime: 150, key: 'balance:BTC' })).toBe('stale');
  });
});

describe('Balance & position synchronizers', () => {
  it('loads, upserts, applies deltas and reflects a sorted view', () => {
    const sync = new BinanceBalanceSynchronizer();
    sync.load([
      { asset: 'BTC', free: 1, locked: 0 },
      { asset: 'USDT', free: 500, locked: 0 },
    ]);
    sync.applyDelta('BTC', 0.5);
    sync.upsert({ asset: 'ETH', free: 2, locked: 0 });
    expect(sync.get('BTC')).toEqual({ asset: 'BTC', free: 1.5, locked: 0 });
    expect(sync.all().map((b) => b.asset)).toEqual(['BTC', 'ETH', 'USDT']);
  });

  it('keeps positions by symbol+side and removes flat positions', () => {
    const sync = new BinancePositionSynchronizer();
    const base: AccountPosition = {
      symbol: 'BTC-USDT',
      venueSymbol: 'BTCUSDT',
      positionAmount: -0.5,
      entryPrice: 25000,
      unrealizedPnl: 0,
      accumulatedRealized: 0,
      marginType: 'cross',
      isolatedWallet: 0,
      positionSide: 'BOTH',
    };
    sync.load([base]);
    expect(sync.size).toBe(1);
    sync.upsert({ ...base, positionAmount: 0 }); // flat → removed
    expect(sync.size).toBe(0);
  });
});

describe('EventProcessor', () => {
  function setup() {
    const balances = new BinanceBalanceSynchronizer();
    balances.load([{ asset: 'BTC', free: 1, locked: 0 }]);
    const positions = new BinancePositionSynchronizer();
    const processor = new EventProcessor({
      sequence: new SequenceValidator(),
      balances,
      positions,
    });
    return { processor, balances, positions };
  }

  it('applies a balance delta once and drops the duplicate', () => {
    const { processor, balances } = setup();
    const event: BalanceUpdatedEvent = {
      kind: 'balanceUpdated',
      asset: 'BTC',
      delta: 0.5,
      clearTime: 1,
      eventTime: 100,
    };
    expect(processor.process(event).applied).toBe(true);
    expect(processor.process(event).decision).toBe('duplicate');
    expect(balances.get('BTC')?.free).toBe(1.5);
  });

  it('applies account and position updates', () => {
    const { processor, balances, positions } = setup();
    const account: AccountUpdatedEvent = {
      kind: 'accountUpdated',
      market: 'FUTURES',
      balances: [{ asset: 'USDT', free: 1000, locked: 0 }],
      positions: [],
      eventTime: 100,
      lastUpdateTime: 100,
    };
    processor.process(account);
    expect(balances.get('USDT')?.free).toBe(1000);

    const position: PositionUpdatedEvent = {
      kind: 'positionUpdated',
      symbol: 'BTC-USDT',
      venueSymbol: 'BTCUSDT',
      positionAmount: 1,
      entryPrice: 25000,
      unrealizedPnl: 0,
      accumulatedRealized: 0,
      marginType: 'cross',
      isolatedWallet: 0,
      positionSide: 'LONG',
      eventTime: 200,
    };
    processor.process(position);
    expect(positions.get('BTCUSDT', 'LONG')?.positionAmount).toBe(1);
  });
});

describe('StateReconciler', () => {
  it('reports mismatches and reconciles from the snapshot', () => {
    const reconciler = new StateReconciler();
    const balances = new BinanceBalanceSynchronizer();
    const positions = new BinancePositionSynchronizer();
    balances.load([{ asset: 'BTC', free: 1, locked: 0 }]);
    const snapshot: AccountState = {
      market: 'SPOT',
      permissions: ['SPOT'],
      balances: [{ asset: 'BTC', free: 2, locked: 0 }],
      positions: [],
      updateTime: 1,
    };
    const report = reconciler.verify(snapshot, {
      balances: balances.all(),
      positions: positions.all(),
    });
    expect(report.consistent).toBe(false);
    reconciler.reconcile(balances, positions, snapshot);
    expect(balances.get('BTC')?.free).toBe(2);
  });
});

describe('Mappers & validators', () => {
  it('maps spot and futures balances and positions', () => {
    const balances = new BalanceMapper();
    expect(balances.fromSpot({ asset: 'BTC', free: '1', locked: '0.5' })).toEqual({
      asset: 'BTC',
      free: 1,
      locked: 0.5,
    });
    expect(
      balances.fromFutures({ asset: 'USDT', balance: '1000', availableBalance: '900' }),
    ).toMatchObject({
      asset: 'USDT',
      free: 900,
      locked: 100,
      walletBalance: 1000,
    });
    const position = new PositionMapper().fromPositionRisk({
      symbol: 'BTCUSDT',
      positionAmt: '-0.5',
      entryPrice: '25000',
      unRealizedProfit: '-10',
      markPrice: '24000',
      leverage: '10',
      positionSide: 'BOTH',
    });
    expect(position).toMatchObject({ positionAmount: -0.5, markPrice: 24000, leverage: 10 });
  });

  it('flags negative balances', () => {
    const state: AccountState = {
      market: 'SPOT',
      permissions: ['SPOT'],
      balances: [{ asset: 'BTC', free: -1, locked: 0 } as AccountBalance],
      positions: [],
      updateTime: 1,
    };
    expect(new AccountValidator().isValid(state)).toBe(false);
  });
});
