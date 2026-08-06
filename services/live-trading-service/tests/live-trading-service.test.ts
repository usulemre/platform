import { describe, it, expect } from 'vitest';
import {
  TRADING_CAPABILITIES,
  DEPLOYMENT_STAGES,
  ORDER_STATES,
  METRIC_CATALOG,
  PROVIDERS,
  BROKER_KINDS,
  deploymentKey,
  canPause,
  canResume,
  isTerminalOrder,
  describeStage,
  nextStage,
} from '@platform/trading-sdk';
import { resolveByKey, searchDeployments } from '../src/domain/discovery';
import {
  canEngageKillSwitch,
  isEmergencyStoppable,
  isLiveAuthorized,
  isPausable,
  overallApproval,
} from '../src/domain/lifecycle';
import {
  approvalQueue,
  currentVersion,
  deploymentHistory,
  killed,
  runningStrategies,
} from '../src/domain/derivations';
import { createLiveTradingService } from '../src/composition';
import { DEPLOYMENTS } from '../src/infrastructure/in-memory/seed';

const AT = '2026-08-03T00:00:00.000Z';
const equityMn = DEPLOYMENTS.find((d) => d.id === 'DEP-EQUITY-MN')!;
const fxCarry = DEPLOYMENTS.find((d) => d.id === 'DEP-FX-CARRY')!;
const halted = DEPLOYMENTS.find((d) => d.id === 'DEP-VOL-HALTED')!;

describe('@platform/trading-sdk vocabulary', () => {
  it('orders 9 deployment stages and 9 order states', () => {
    expect(DEPLOYMENT_STAGES).toHaveLength(9);
    expect(DEPLOYMENT_STAGES[0]).toBe('CANDIDATE_STRATEGY');
    expect(DEPLOYMENT_STAGES[8]).toBe('ARCHIVED');
    expect(ORDER_STATES).toHaveLength(9);
    expect(nextStage('ARCHIVED')).toBeNull();
    expect(describeStage('RISK_APPROVAL').gate).toBe(true);
    expect(describeStage('DEPLOYMENT_APPROVAL').gate).toBe(true);
    expect(isTerminalOrder('FILLED')).toBe(true);
    expect(isTerminalOrder('ACCEPTED')).toBe(false);
  });

  it('exposes capabilities, broker abstractions, providers and a metric catalog', () => {
    expect(TRADING_CAPABILITIES.length).toBeGreaterThanOrEqual(12);
    expect(BROKER_KINDS).toHaveLength(5);
    expect(PROVIDERS.map((p) => p.id)).toEqual([
      'binance',
      'hyperliquid',
      'deribit',
      'interactive-brokers',
      'alpaca',
      'bist',
    ]);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
    expect(deploymentKey('Equities', 'Market Neutral', 'Equity MN')).toBe(
      'equities/market-neutral/equity-mn',
    );
    expect(canPause('RUNNING')).toBe(true);
    expect(canResume('PAUSED')).toBe(true);
  });
});

describe('discovery (pure filter/search)', () => {
  it('filters by namespace and stage', () => {
    expect(
      searchDeployments(DEPLOYMENTS, { namespace: 'crypto' }).every(
        (d) => d.namespace === 'crypto',
      ),
    ).toBe(true);
    expect(searchDeployments(DEPLOYMENTS, { stage: 'RUNNING' })).toHaveLength(2);
  });

  it('resolves a deployment by its canonical key', () => {
    const key = deploymentKey(equityMn.namespace, equityMn.family, equityMn.name);
    expect(resolveByKey(DEPLOYMENTS, key)?.id).toBe('DEP-EQUITY-MN');
    expect(resolveByKey(DEPLOYMENTS, 'nope/none/none')).toBeNull();
  });
});

describe('lifecycle + derivations (pure)', () => {
  it('gates runtime controls and reflects live authorization', () => {
    expect(isPausable(equityMn)).toBe(true);
    expect(isPausable(fxCarry)).toBe(false);
    expect(isLiveAuthorized(equityMn)).toBe(true);
    expect(isLiveAuthorized(halted)).toBe(false);
  });

  it('keeps the kill switch always available (never gated by AI)', () => {
    expect(canEngageKillSwitch(equityMn)).toBe(true);
    expect(canEngageKillSwitch(fxCarry)).toBe(true);
    expect(canEngageKillSwitch(halted)).toBe(true);
    expect(isEmergencyStoppable(equityMn)).toBe(true);
    expect(isEmergencyStoppable(halted)).toBe(true);
  });

  it('derives approval, running strategies, history and killed sets', () => {
    expect(overallApproval(equityMn)).toBe('APPROVED');
    expect(runningStrategies(DEPLOYMENTS).length).toBe(3);
    expect(approvalQueue(DEPLOYMENTS).some((d) => d.id === 'DEP-MULTI-ASSET')).toBe(true);
    expect(deploymentHistory(DEPLOYMENTS).some((d) => d.id === 'DEP-VOL-HALTED')).toBe(true);
    expect(killed(DEPLOYMENTS).some((d) => d.id === 'DEP-VOL-HALTED')).toBe(true);
    expect(currentVersion(equityMn)?.version).toBe('2.0.0');
  });
});

describe('LiveTradingService (over in-memory ports)', () => {
  const service = createLiveTradingService();

  it('lists the registry, accounts, connections and providers', async () => {
    expect(await service.listDeployments()).toHaveLength(DEPLOYMENTS.length);
    expect((await service.listAccounts()).length).toBeGreaterThan(0);
    expect((await service.listConnections()).length).toBeGreaterThan(0);
    expect(service.listProviders().length).toBe(6);
    expect(await service.getDeployment('nope')).toBeNull();
  });

  it('summarizes by stage, runtime, mode, accounts and connections', async () => {
    const summary = await service.getSummary();
    expect(summary.totalDeployments).toBe(DEPLOYMENTS.length);
    expect(summary.running).toBe(2);
    expect(summary.paused).toBe(1);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.live).toBe(3);
    expect(summary.families).toBe(5);
    expect(summary.byStage.length).toBeGreaterThan(0);
  });

  it('applies runtime controls only when permitted; false otherwise', async () => {
    expect(await service.controlRuntime('DEP-EQUITY-MN', 'pause', AT)).toBe(true);
    expect(await service.controlRuntime('DEP-FX-CARRY', 'pause', AT)).toBe(false);
    expect(await service.controlRuntime('DEP-FX-CARRY', 'resume', AT)).toBe(true);
    expect(await service.controlRuntime('nope', 'stop', AT)).toBe(false);
  });

  it('always honours the kill switch and emergency stop for known active deployments', async () => {
    expect(await service.engageKillSwitch('DEP-EQUITY-MN', 'Erin Risk', AT)).toBe(true);
    expect(await service.engageKillSwitch('DEP-FX-CARRY', 'Erin Risk', AT)).toBe(true);
    expect(await service.emergencyStop('DEP-EQUITY-MN', 'Dana Ops', AT)).toBe(true);
    expect(await service.engageKillSwitch('nope', 'Erin Risk', AT)).toBe(false);
  });

  it('records deployment/risk/deployment-approval requests; false for unknown', async () => {
    expect(await service.requestDeployment('DEP-MULTI-ASSET', AT)).toBe(true);
    expect(await service.requestRiskApproval('DEP-MULTI-ASSET', AT)).toBe(true);
    expect(await service.requestDeploymentApproval('DEP-MULTI-ASSET', AT)).toBe(true);
    expect(await service.requestDeployment('nope', AT)).toBe(false);
  });

  it('reflects validation, risk and live authorization decided elsewhere', async () => {
    expect(await service.isValidated('DEP-EQUITY-MN')).toBe(true);
    expect(await service.isRiskApproved('DEP-EQUITY-MN')).toBe(true);
    expect(await service.isLiveAuthorized('DEP-EQUITY-MN')).toBe(true);
    expect(await service.isLiveAuthorized('DEP-VOL-HALTED')).toBe(false);
  });
});
