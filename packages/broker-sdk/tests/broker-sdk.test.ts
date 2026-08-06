import { describe, it, expect } from 'vitest';
import {
  BROKER_ACTIONS,
  BROKER_STATUSES,
  BROKER_TRANSITIONS,
  CAPABILITY_CATALOG,
  CAPABILITY_TYPES,
  PROVIDER_CATALOG,
  PROVIDER_IDS,
  ProviderNotImplementedError,
  canApplyAction,
  canTransition,
  computeBrokerHealth,
  createPlaceholderProvider,
  describeProvider,
  hasCapability,
  happyPathNext,
  isActiveStatus,
  isTerminalStatus,
  missingCapabilities,
  permittedActions,
  providerSupports,
  type GatewayConfiguration,
} from '../src/index';

describe('broker lifecycle state machine', () => {
  it('defines 8 statuses and the happy path', () => {
    expect(BROKER_STATUSES).toHaveLength(8);
    expect(BROKER_STATUSES[0]).toBe('REGISTERED');
    expect(happyPathNext('REGISTERED')).toBe('CONFIGURED');
    expect(happyPathNext('CONFIGURED')).toBe('AUTHENTICATED');
    expect(happyPathNext('AUTHENTICATED')).toBe('CONNECTED');
    expect(happyPathNext('CONNECTED')).toBe('HEALTHY');
    expect(happyPathNext('HEALTHY')).toBeNull();
  });

  it('enforces legal transitions', () => {
    expect(canTransition('REGISTERED', 'CONFIGURED')).toBe(true);
    expect(canTransition('REGISTERED', 'CONNECTED')).toBe(false);
    expect(canTransition('HEALTHY', 'DEGRADED')).toBe(true);
    expect(canTransition('DEGRADED', 'HEALTHY')).toBe(true);
    expect(canTransition('DISCONNECTED', 'CONNECTED')).toBe(true);
    expect(canTransition('ARCHIVED', 'REGISTERED')).toBe(false);
    expect(BROKER_TRANSITIONS.ARCHIVED).toEqual([]);
  });

  it('classifies active and terminal statuses', () => {
    expect(isActiveStatus('HEALTHY')).toBe(true);
    expect(isActiveStatus('DEGRADED')).toBe(true);
    expect(isActiveStatus('DISCONNECTED')).toBe(false);
    expect(isTerminalStatus('ARCHIVED')).toBe(true);
  });

  it('gates actions by status', () => {
    expect(permittedActions('DISCONNECTED').sort()).toEqual(['failover', 'reconnect', 'recovery']);
    expect(permittedActions('HEALTHY').sort()).toEqual(['failover', 'health_check', 'heartbeat']);
    expect(permittedActions('DEGRADED').sort()).toEqual([
      'failover',
      'health_check',
      'heartbeat',
      'recovery',
    ]);
    expect(permittedActions('ARCHIVED')).toEqual([]);
    expect(canApplyAction('REGISTERED', 'reconnect')).toBe(false);
    expect(BROKER_ACTIONS).toHaveLength(5);
  });
});

describe('capability contracts', () => {
  it('defines the 10 canonical capabilities', () => {
    expect(CAPABILITY_CATALOG).toHaveLength(10);
    expect(CAPABILITY_TYPES).toContain('SUBMIT_ORDER');
    expect(CAPABILITY_TYPES).toContain('HEARTBEAT');
    expect(hasCapability(['SUBMIT_ORDER', 'HEARTBEAT'], 'SUBMIT_ORDER')).toBe(true);
    expect(missingCapabilities(['SUBMIT_ORDER'], ['SUBMIT_ORDER', 'CANCEL_ORDER'])).toEqual([
      'CANCEL_ORDER',
    ]);
  });
});

describe('provider catalog', () => {
  it('defines 10 provider descriptors (all placeholders)', () => {
    expect(PROVIDER_CATALOG).toHaveLength(10);
    expect(PROVIDER_IDS).toContain('binance');
    expect(PROVIDER_IDS).toContain('bist');
    expect(PROVIDER_CATALOG.every((p) => p.placeholder)).toBe(true);
    expect(describeProvider('interactive-brokers').transport).toBe('FIX');
    expect(providerSupports('binance', 'SUBMIT_ORDER')).toBe(true);
    expect(providerSupports('bist', 'MARKET_DATA_SUBSCRIPTION')).toBe(false);
  });
});

describe('placeholder provider (provider interface)', () => {
  it('answers metadata truthfully but refuses capability operations', async () => {
    const provider = createPlaceholderProvider(describeProvider('alpaca'));
    expect(provider.descriptor.id).toBe('alpaca');
    expect(provider.supports('SUBMIT_ORDER')).toBe(true);
    expect(provider.supports('MARKET_DATA_SUBSCRIPTION')).toBe(true);
    const ctx = {
      brokerId: 'BRK-1',
      config: {} as GatewayConfiguration,
      at: '2026-08-06T00:00:00.000Z',
    };
    await expect(provider.connect(ctx)).rejects.toBeInstanceOf(ProviderNotImplementedError);
    await expect(provider.queryPositions(ctx)).rejects.toBeInstanceOf(ProviderNotImplementedError);
    await expect(provider.heartbeat(ctx)).rejects.toThrow(/placeholder/);
  });
});

describe('health computation (deterministic)', () => {
  const base = { brokerId: 'BRK-1', heartbeatIntervalMs: 1000, at: '2026-08-06T00:00:00.000Z' };
  it('is healthy with fresh heartbeat, low latency and low errors', () => {
    const h = computeBrokerHealth({
      ...base,
      status: 'HEALTHY',
      heartbeatAgeMs: 500,
      latencyMs: 40,
      errorRate: 0.0,
    });
    expect(h.level).toBe('HEALTHY');
    expect(h.score).toBe(100);
    expect(h.checks).toHaveLength(3);
  });
  it('degrades on stale heartbeat or high latency', () => {
    const stale = computeBrokerHealth({
      ...base,
      status: 'HEALTHY',
      heartbeatAgeMs: 2500,
      latencyMs: 300,
      errorRate: 0.03,
    });
    expect(stale.score).toBeLessThan(80);
    expect(['DEGRADED', 'UNHEALTHY']).toContain(stale.level);
  });
  it('is offline when not connected', () => {
    const off = computeBrokerHealth({
      ...base,
      status: 'DISCONNECTED',
      heartbeatAgeMs: 999999,
      latencyMs: 0,
      errorRate: 0,
    });
    expect(off.level).toBe('OFFLINE');
    expect(off.score).toBe(0);
  });
  it('is deterministic', () => {
    const input = {
      ...base,
      status: 'HEALTHY' as const,
      heartbeatAgeMs: 1200,
      latencyMs: 260,
      errorRate: 0.05,
    };
    expect(computeBrokerHealth(input)).toEqual(computeBrokerHealth(input));
  });
});
