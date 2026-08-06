import { describe, it, expect } from 'vitest';
import {
  SIGNAL_ENGINE_CAPABILITIES,
  SIGNAL_STAGES,
  compareVersions,
  describeStage,
  nextStage,
  signalKey,
} from '@platform/signal-sdk';
import { resolveByKey, searchSignals } from '../src/domain/discovery';
import {
  isEligibleForPromotion,
  isReadyForApproval,
  overallApproval,
} from '../src/domain/lifecycle';
import {
  approvalQueue,
  currentVersion,
  deriveHealth,
  promotionQueue,
  qualityGrade,
} from '../src/domain/derivations';
import { createSignalEngineService } from '../src/composition';
import { SIGNALS } from '../src/infrastructure/in-memory/seed';

const AT = '2026-08-03T00:00:00.000Z';
const reversal = SIGNALS.find((s) => s.id === 'SG-REVERSAL')!;
const rates = SIGNALS.find((s) => s.id === 'SG-RATES-VALUE')!;

describe('@platform/signal-sdk vocabulary', () => {
  it('orders 7 lifecycle stages candidate → production candidate', () => {
    expect(SIGNAL_STAGES).toHaveLength(7);
    expect(SIGNAL_STAGES[0]).toBe('CANDIDATE');
    expect(SIGNAL_STAGES[6]).toBe('PRODUCTION_CANDIDATE');
    expect(nextStage('PRODUCTION_CANDIDATE')).toBeNull();
    expect(describeStage('APPROVAL').gate).toBe(true);
  });

  it('exposes 12 engine capabilities and a canonical key', () => {
    expect(SIGNAL_ENGINE_CAPABILITIES).toHaveLength(12);
    expect(signalKey('Equities', 'Reversal', 'Short horizon')).toBe(
      'equities/reversal/short-horizon',
    );
    expect(compareVersions('2.1.0', '2.0.0')).toBeGreaterThan(0);
  });
});

describe('discovery (pure filter/search)', () => {
  it('filters by namespace, stage and tag', () => {
    expect(searchSignals(SIGNALS, { namespace: 'fx' }).every((s) => s.namespace === 'fx')).toBe(
      true,
    );
    expect(searchSignals(SIGNALS, { stage: 'APPROVAL' }).every((s) => s.stage === 'APPROVAL')).toBe(
      true,
    );
    expect(searchSignals(SIGNALS, { tag: 'reversal' })).toHaveLength(1);
  });

  it('searches across name, namespace, family, owner and tags', () => {
    const result = searchSignals(SIGNALS, { search: 'carry' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('SG-FX-CARRY');
  });

  it('resolves a signal by its canonical key', () => {
    const key = signalKey(reversal.namespace, reversal.family, reversal.name);
    expect(resolveByKey(SIGNALS, key)?.id).toBe('SG-REVERSAL');
    expect(resolveByKey(SIGNALS, 'nope/none/none')).toBeNull();
  });
});

describe('lifecycle + derivations (pure)', () => {
  it('gates approval readiness and promotion eligibility', () => {
    expect(isReadyForApproval(rates)).toBe(true);
    expect(isEligibleForPromotion(reversal)).toBe(true);
    expect(isEligibleForPromotion(rates)).toBe(false);
  });

  it('derives overall approval from recorded approvals', () => {
    expect(overallApproval(reversal)).toBe('APPROVED');
    expect(overallApproval(rates)).toBe('PENDING');
  });

  it('grades quality and derives health', () => {
    expect(qualityGrade(0.998, 0.994)).toBe('PASS');
    expect(qualityGrade(0.9, 0.8)).toBe('FAIL');
    expect(deriveHealth('PRODUCTION_CANDIDATE', 'PASS')).toBe('HEALTHY');
    expect(deriveHealth('CANDIDATE', 'PASS')).toBe('UNKNOWN');
  });

  it('selects newest version and builds the queues', () => {
    expect(currentVersion(reversal)?.version).toBe('2.1.0');
    expect(promotionQueue(SIGNALS).some((s) => s.id === 'SG-FX-CARRY')).toBe(true);
    expect(approvalQueue(SIGNALS).map((s) => s.id)).toContain('SG-RATES-VALUE');
  });
});

describe('SignalEngineService (over in-memory ports)', () => {
  const service = createSignalEngineService();

  it('lists the catalog and one signal', async () => {
    expect(await service.listSignals()).toHaveLength(SIGNALS.length);
    expect(await service.getSignal('SG-FX-CARRY')).not.toBeNull();
    expect(await service.getSignal('nope')).toBeNull();
  });

  it('summarizes by stage, validation, approval, promotion and sync', async () => {
    const summary = await service.getSummary();
    expect(summary.totalSignals).toBe(SIGNALS.length);
    expect(summary.production).toBe(1);
    expect(summary.awaitingApproval).toBeGreaterThan(0);
    expect(summary.queuedForPromotion).toBeGreaterThan(0);
    expect(summary.syncDrift).toBeGreaterThan(0);
    expect(summary.byStage.length).toBeGreaterThan(0);
  });

  it('exposes queues, families and discovery candidates', async () => {
    expect((await service.promotionQueue()).length).toBeGreaterThan(0);
    expect((await service.approvalQueue()).length).toBeGreaterThan(0);
    expect((await service.listFamilies()).length).toBe(5);
    expect((await service.listCandidates()).length).toBeGreaterThan(0);
  });

  it('records review/approval/promotion/sync requests; false for unknown', async () => {
    expect(await service.requestReview('SG-CREDIT-MOM', AT)).toBe(true);
    expect(await service.requestApproval('SG-RATES-VALUE', AT)).toBe(true);
    expect(await service.requestPromotion('SG-FX-CARRY', AT)).toBe(true);
    expect(await service.requestSync('SG-REVERSAL', AT)).toBe(true);
    expect(await service.requestPromotion('nope', AT)).toBe(false);
  });

  it('reflects validation status decided elsewhere', async () => {
    expect(await service.isValidated('SG-REVERSAL')).toBe(true);
    expect(await service.isValidated('SG-CREDIT-MOM')).toBe(false);
  });
});
