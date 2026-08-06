import { describe, it, expect } from 'vitest';
import {
  TRADING_CAPABILITIES,
  DEPLOYMENT_STAGES,
  ORDER_STATES,
  PROVIDERS,
  deploymentKey,
} from '@platform/trading-sdk';
import { applyDeploymentQuery } from '../src/modules/live-trading/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/live-trading/domain/mappers';
import { LiveTradingAdminService } from '../src/modules/live-trading/application/live-trading-service';
import {
  MockLiveTradingRepository,
  LIVE_TRADING_SEED,
} from '../src/modules/live-trading/data/mock-repository';

const { deployments, accounts, connections, families } = LIVE_TRADING_SEED;
const equityMn = deployments.find((d) => d.id === 'DEP-EQUITY-MN')!;
const halted = deployments.find((d) => d.id === 'DEP-VOL-HALTED')!;

describe('@platform/trading-sdk vocabulary is shared', () => {
  it('exposes 9 deployment stages, 9 order states, capabilities and providers', () => {
    expect(DEPLOYMENT_STAGES).toHaveLength(9);
    expect(DEPLOYMENT_STAGES[0]).toBe('CANDIDATE_STRATEGY');
    expect(DEPLOYMENT_STAGES[8]).toBe('ARCHIVED');
    expect(ORDER_STATES).toHaveLength(9);
    expect(TRADING_CAPABILITIES.length).toBeGreaterThanOrEqual(12);
    expect(PROVIDERS.length).toBe(6);
  });
});

describe('applyDeploymentQuery (pure filter/sort/search)', () => {
  it('filters by namespace and stage', () => {
    expect(
      applyDeploymentQuery(deployments, { namespace: 'crypto' }).every(
        (d) => d.namespace === 'crypto',
      ),
    ).toBe(true);
    expect(applyDeploymentQuery(deployments, { stage: 'RUNNING' })).toHaveLength(2);
  });

  it('searches across name, namespace, family, owner and tags', () => {
    const result = applyDeploymentQuery(deployments, { search: 'crypto' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('DEP-CRYPTO-MOM');
  });
});

describe('mappers (pure DTO → VM)', () => {
  it('maps a list item with stage/runtime/mode/kill-switch', () => {
    const vm = toListItemVm(equityMn);
    expect(vm.stage.label).toBe('Running');
    expect(vm.mode.label).toBe('Live');
    expect(vm.killSwitch.value).toBe('ARMED');
  });

  it('maps a detail with 9 stage steps, always-available emergency controls and deep-linked deps', () => {
    const vm = toDetailVm(equityMn);
    expect(vm.key).toBe(deploymentKey(equityMn.namespace, equityMn.family, equityMn.name));
    expect(vm.stages).toHaveLength(9);
    const kill = vm.runtimeControls.find((c) => c.control === 'kill-switch')!;
    const emergency = vm.runtimeControls.find((c) => c.control === 'emergency-stop')!;
    expect(kill.enabled).toBe(true);
    expect(kill.emergency).toBe(true);
    expect(emergency.enabled).toBe(true);
    expect(vm.orders.length).toBeGreaterThan(0);
    expect(vm.dependencies.find((d) => d.kind === 'PORTFOLIO')?.href).toBe(
      '/portfolio-construction/pf-equity-mn',
    );
    expect(vm.authorization?.valid.label).toBe('Valid');
    expect(vm.links.some((l) => l.href === '/execution-simulator/sim-equity-mn')).toBe(true);
  });

  it('keeps the kill switch enabled even for a halted deployment', () => {
    const vm = toDetailVm(halted);
    expect(vm.runtimeControls.find((c) => c.control === 'kill-switch')?.enabled).toBe(true);
    expect(vm.killSwitch.status.value).toBe('ENGAGED');
    expect(vm.authorization?.valid.label).toBe('Invalid/expired');
  });

  it('summarizes by lifecycle stage, runtime and mode', () => {
    const summary = toSummaryVm(deployments, accounts.length, connections.length, families.length);
    expect(summary.totalDeployments).toBe(deployments.length);
    expect(summary.running).toBe(2);
    expect(summary.paused).toBe(1);
    expect(summary.halted).toBe(1);
    expect(summary.live).toBe(3);
    expect(summary.byStage.every((b) => b.count > 0)).toBe(true);
  });
});

describe('LiveTradingAdminService (over the mock repository)', () => {
  const service = new LiveTradingAdminService(new MockLiveTradingRepository());

  it('lists deployments, accounts, connections and providers', async () => {
    expect(await service.listDeployments()).toHaveLength(deployments.length);
    expect((await service.listAccounts()).length).toBe(accounts.length);
    expect((await service.listConnections()).length).toBe(connections.length);
    expect((await service.listProviders()).length).toBe(6);
    expect(await service.getDeployment('nope')).toBeNull();
  });

  it('exposes running, approval, history, orders, positions, health and audit aggregates', async () => {
    expect((await service.getRunningStrategies()).length).toBe(3);
    expect((await service.getApprovalQueue()).some((i) => i.id === 'DEP-MULTI-ASSET')).toBe(true);
    expect((await service.getHistory()).some((i) => i.id === 'DEP-VOL-HALTED')).toBe(true);
    expect((await service.getOrders()).length).toBeGreaterThan(0);
    expect((await service.getOpenPositions()).length).toBeGreaterThan(0);
    expect((await service.getClosedPositions()).length).toBeGreaterThan(0);
    expect((await service.getBalances()).length).toBeGreaterThan(0);
    expect((await service.getHealthOverview()).length).toBe(deployments.length);
    expect((await service.getAudit()).length).toBeGreaterThan(0);
    expect((await service.getEmergencyControls()).every((r) => r.controls.length > 0)).toBe(true);
  });

  it('summarizes', async () => {
    expect((await service.getSummary()).totalDeployments).toBe(deployments.length);
  });
});
