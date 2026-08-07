import { describe, it, expect } from 'vitest';
import { ProviderNotImplementedError, canTransition, permittedActions } from '@platform/broker-sdk';
import {
  applyAction,
  authenticate,
  configure,
  connect,
  createBroker,
  recomputeHealthStatus,
} from '../src/domain/lifecycle';
import { computeBrokerMetrics, computeConnectivity } from '../src/domain/metrics';
import { capabilityMatrix, providerRegistrations } from '../src/domain/registry';
import { computeBalanceSync, computeOrderSync, computePositionSync } from '../src/domain/sync';
import { applyBrokerQuery } from '../src/domain/search';
import { replayBroker } from '../src/domain/replay';
import { BROKERS } from '../src/infrastructure/in-memory/seed';
import { PROVIDER_FACTORIES, createBrokerGatewayService } from '../src/composition';
import type { GatewayConfiguration } from '@platform/broker-sdk';

const AT = '2026-08-06T09:00:00.000Z';

function config(id: string): GatewayConfiguration {
  return {
    brokerId: id,
    providerId: 'binance',
    endpointRef: `config://${id}`,
    credentialRef: `secret://${id}`,
    transport: 'HYBRID',
    environment: 'PAPER',
    heartbeatIntervalMs: 1000,
    reconnectMaxAttempts: 5,
    capabilities: ['SUBMIT_ORDER', 'HEARTBEAT', 'QUERY_POSITIONS', 'QUERY_BALANCES', 'QUERY_ORDER'],
    version: 1,
  };
}

/* --------------------------------- unit --------------------------------- */

describe('lifecycle application (state machine)', () => {
  it('registers and provisions to CONNECTED along legal transitions', () => {
    let broker = createBroker({
      id: 'BRK-T',
      name: 'Test',
      configuration: config('BRK-T'),
      region: 'x',
      actor: 't',
      at: AT,
    });
    expect(broker.status).toBe('REGISTERED');
    const c = configure(broker, 't', AT);
    expect(c.ok && canTransition('REGISTERED', 'CONFIGURED')).toBe(true);
    broker = (c as { ok: true; broker: typeof broker }).broker;
    broker = (authenticate(broker, 't', AT) as { ok: true; broker: typeof broker }).broker;
    expect(broker.session?.state).toBe('OPEN');
    broker = (connect(broker, 't', AT, 40) as { ok: true; broker: typeof broker }).broker;
    expect(broker.status).toBe('CONNECTED');
    expect(broker.connection.connectedAt).toBe(AT);
  });

  it('rejects an illegal transition', () => {
    const broker = createBroker({
      id: 'BRK-T2',
      name: 'Test',
      configuration: config('BRK-T2'),
      region: 'x',
      actor: 't',
      at: AT,
    });
    const result = applyAction(broker, 'reconnect', 't', AT); // not permitted from REGISTERED
    expect(result.ok).toBe(false);
  });

  it('health check lands on HEALTHY or DEGRADED; reconnect/recovery work', () => {
    let broker = createBroker({
      id: 'BRK-T3',
      name: 'Test',
      configuration: config('BRK-T3'),
      region: 'x',
      actor: 't',
      at: AT,
    });
    broker = (configure(broker, 't', AT) as { ok: true; broker: typeof broker }).broker;
    broker = (authenticate(broker, 't', AT) as { ok: true; broker: typeof broker }).broker;
    broker = (connect(broker, 't', AT, 40) as { ok: true; broker: typeof broker }).broker;
    broker = (recomputeHealthStatus(broker, 't', AT) as { ok: true; broker: typeof broker }).broker;
    expect(broker.status).toBe('HEALTHY');
    expect(permittedActions(broker.status)).toContain('failover');
    const down = applyAction(broker, 'failover', 't', AT, 'BRK-0005');
    expect(down.ok && down.broker.status).toBe('DISCONNECTED');
    const reconn = applyAction(
      (down as { ok: true; broker: typeof broker }).broker,
      'reconnect',
      't',
      AT,
    );
    expect(reconn.ok && reconn.broker.status).toBe('CONNECTED');
    expect(reconn.ok && reconn.broker.reconnectAttempts).toBe(1);
  });
});

describe('seed brokers', () => {
  it('are well-formed and replay consistently', () => {
    expect(BROKERS.length).toBe(10);
    for (const broker of BROKERS) {
      expect(broker.events.length).toBeGreaterThanOrEqual(1);
      const replay = replayBroker(broker);
      expect(replay.reconstructedStatus).toBe(broker.status);
      expect(replay.consistent).toBe(true);
    }
  });
  it('cover the expected end states', () => {
    const byStatus = new Map<string, number>();
    for (const b of BROKERS) byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1);
    expect(byStatus.get('HEALTHY')).toBeGreaterThanOrEqual(3);
    expect(byStatus.get('DEGRADED')).toBe(1);
    expect(byStatus.get('DISCONNECTED')).toBe(1);
    expect(byStatus.get('ARCHIVED')).toBe(1);
  });
});

describe('registry, sync, metrics, search (pure)', () => {
  it('builds a capability matrix and provider registrations', () => {
    expect(capabilityMatrix()).toHaveLength(10);
    const regs = providerRegistrations(BROKERS);
    expect(regs).toHaveLength(10);
    expect(regs.find((r) => r.descriptor.id === 'binance')!.registeredBrokers).toBe(1);
  });
  it('summarizes account synchronization', () => {
    const healthy = BROKERS.find((b) => b.id === 'BRK-0001')!;
    expect(computePositionSync(healthy)!.longCount).toBe(1);
    expect(computeBalanceSync(healthy)!.currencies).toBe(2);
    expect(computeOrderSync(healthy)!.open).toBe(1);
    expect(computePositionSync(BROKERS.find((b) => b.id === 'BRK-0007')!)).toBeNull();
  });
  it('computes metrics and connectivity', () => {
    const metrics = computeBrokerMetrics(BROKERS);
    expect(metrics.total).toBe(10);
    expect(metrics.connected).toBeGreaterThanOrEqual(5);
    expect(metrics.capabilityCoverage).toHaveLength(10);
    const connectivity = computeConnectivity(BROKERS);
    expect(connectivity[0]!.score).toBeLessThanOrEqual(
      connectivity[connectivity.length - 1]!.score,
    );
  });
  it('scopes brokers', () => {
    expect(
      applyBrokerQuery(BROKERS, { scope: 'DISCONNECTED' }).every(
        (b) => b.status === 'DISCONNECTED',
      ),
    ).toBe(true);
    expect(applyBrokerQuery(BROKERS, { providerId: 'binance' }).length).toBe(1);
  });
});

describe('provider registry (DI)', () => {
  it('registers all 10 provider ids; placeholder adapters still throw (no live transport)', async () => {
    expect(Object.keys(PROVIDER_FACTORIES).sort()).toContain('binance-futures');
    expect(Object.keys(PROVIDER_FACTORIES)).toHaveLength(10);
    // A still-placeholder provider rejects its capability operations.
    const placeholder = PROVIDER_FACTORIES['hyperliquid']!();
    expect(placeholder.supports('SUBMIT_ORDER')).toBe(true);
    await expect(
      placeholder.connect({ brokerId: 'x', config: {} as GatewayConfiguration, at: AT }),
    ).rejects.toBeInstanceOf(ProviderNotImplementedError);
  });

  it('binds a live Binance adapter that declares capabilities and fails closed when unconfigured', async () => {
    const binance = PROVIDER_FACTORIES['binance']!();
    expect(binance.descriptor.placeholder).toBe(false);
    expect(binance.supports('SUBMIT_ORDER')).toBe(true);
    // An empty/unbound config cannot resolve a Binance market, so connect rejects (fails closed).
    await expect(
      binance.connect({ brokerId: 'x', config: {} as GatewayConfiguration, at: AT }),
    ).rejects.toThrow();
  });
});

/* ------------------------------ integration ------------------------------ */

describe('BrokerGatewayService (integration over in-memory ports)', () => {
  it('serves read models, registry and metrics', async () => {
    const service = createBrokerGatewayService();
    expect((await service.listBrokers()).length).toBe(10);
    expect(service.listProviders()).toHaveLength(10);
    expect(service.listCapabilities()).toHaveLength(10);
    expect(service.registeredProviderIds()).toHaveLength(10);
    expect((await service.metrics()).total).toBe(10);
    expect((await service.connectivity()).length).toBe(10);
    expect((await service.positionSync()).length).toBeGreaterThan(0);
    expect((await service.sessions()).length).toBeGreaterThan(0);
  });

  it('registers, provisions and drives lifecycle actions', async () => {
    const service = createBrokerGatewayService();
    const reg = await service.registerBroker(
      {
        id: 'BRK-NEW',
        name: 'New Binance',
        providerId: 'binance',
        environment: 'PAPER',
        region: 'x',
      },
      'ops',
      AT,
    );
    expect(reg.ok && reg.broker.status).toBe('REGISTERED');
    expect((await service.provision('BRK-NEW', 'ops', AT)).ok).toBe(true); // → CONFIGURED
    expect((await service.provision('BRK-NEW', 'ops', AT)).ok).toBe(true); // → AUTHENTICATED
    expect((await service.provision('BRK-NEW', 'ops', AT)).ok).toBe(true); // → CONNECTED
    const healthCheck = await service.applyAction('BRK-NEW', 'health_check', 'ops', AT);
    expect(healthCheck.ok && ['HEALTHY', 'DEGRADED']).toBeTruthy();
    expect((await service.getBroker('BRK-NEW'))?.status).not.toBe('REGISTERED');
  });

  it('rejects registering an unknown provider and reports capability routing', async () => {
    const service = createBrokerGatewayService();
    const bad = await service.registerBroker(
      {
        id: 'BRK-BAD',
        name: 'Bad',
        providerId: 'unknown' as never,
        environment: 'PAPER',
        region: 'x',
      },
      'ops',
      AT,
    );
    expect(bad.ok).toBe(false);
    const serve = await service.canServe('BRK-0001', 'SUBMIT_ORDER');
    expect(serve.ok).toBe(true);
    const bist = await service.canServe('BRK-0007', 'SUBMIT_ORDER'); // REGISTERED → not operational
    expect(bist.ok).toBe(false);
  });

  it('fails over a healthy broker and reconnects it', async () => {
    const service = createBrokerGatewayService();
    const failover = await service.applyAction('BRK-0001', 'failover', 'ops', AT, 'BRK-0010');
    expect(failover.ok && failover.broker.status).toBe('DISCONNECTED');
    const reconnect = await service.applyAction('BRK-0001', 'reconnect', 'ops', AT);
    expect(reconnect.ok && reconnect.broker.status).toBe('CONNECTED');
    expect((await service.replay('BRK-0001'))?.consistent).toBe(true);
  });
});
