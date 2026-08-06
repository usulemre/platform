import { describe, it, expect } from 'vitest';
import { SIGNAL_ENGINE_CAPABILITIES, SIGNAL_STAGES, signalKey } from '@platform/signal-sdk';
import { applySignalQuery } from '../src/modules/signal-engine/domain/query';
import {
  toCatalogItemVm,
  toDetailVm,
  toSummaryVm,
} from '../src/modules/signal-engine/domain/mappers';
import { SignalEngineAdminService } from '../src/modules/signal-engine/application/signal-engine-service';
import {
  MockSignalEngineRepository,
  SIGNAL_ENGINE_SEED,
} from '../src/modules/signal-engine/data/mock-repository';

const { signals, families } = SIGNAL_ENGINE_SEED;
const reversal = signals.find((s) => s.id === 'SG-REVERSAL')!;

describe('@platform/signal-sdk vocabulary is shared', () => {
  it('exposes 7 lifecycle stages and 12 capabilities', () => {
    expect(SIGNAL_STAGES).toHaveLength(7);
    expect(SIGNAL_STAGES[0]).toBe('CANDIDATE');
    expect(SIGNAL_STAGES[6]).toBe('PRODUCTION_CANDIDATE');
    expect(SIGNAL_ENGINE_CAPABILITIES).toHaveLength(12);
  });
});

describe('applySignalQuery (pure filter/sort/search)', () => {
  it('filters by namespace and stage', () => {
    expect(applySignalQuery(signals, { namespace: 'fx' }).every((s) => s.namespace === 'fx')).toBe(
      true,
    );
    expect(
      applySignalQuery(signals, { stage: 'APPROVAL' }).every((s) => s.stage === 'APPROVAL'),
    ).toBe(true);
  });

  it('searches across name, namespace, family, owner and tags', () => {
    const result = applySignalQuery(signals, { search: 'carry' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('SG-FX-CARRY');
  });
});

describe('mappers (pure DTO → VM)', () => {
  it('maps a catalog item with stage/validation/promotion tones', () => {
    const vm = toCatalogItemVm(reversal);
    expect(vm.stage.tone).toBe('positive');
    expect(vm.validation.label).toBe('Passed');
    expect(vm.promotion.label).toBe('Promoted');
  });

  it('maps a detail with 7 stage steps, deep-linked deps, lineage and feature inputs', () => {
    const vm = toDetailVm(reversal);
    expect(vm.key).toBe(signalKey(reversal.namespace, reversal.family, reversal.name));
    expect(vm.stages).toHaveLength(7);
    expect(vm.progress.percent).toBe(100);
    expect(vm.versions[0]!.version).toBe('2.1.0');
    expect(vm.versions[0]!.current).toBe(true);
    expect(vm.dependencies.find((d) => d.kind === 'DATASET')?.href).toBe('/datasets/ds-equity-eod');
    expect(vm.lineage.nodes.find((n) => n.kind === 'FEATURE')?.href).toBe(
      '/features/feat-resid-return',
    );
    expect(vm.definition.features[0]!.href).toBe('/features/feat-resid-return');
  });

  it('summarizes by lifecycle stage and flags queues/drift', () => {
    const summary = toSummaryVm(signals, families);
    expect(summary.totalSignals).toBe(signals.length);
    expect(summary.production).toBe(1);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.queuedForPromotion).toBe(1);
    expect(summary.syncDrift).toBeGreaterThan(0);
    expect(summary.byStage.every((b) => b.count > 0)).toBe(true);
  });
});

describe('SignalEngineAdminService (over the mock repository)', () => {
  const service = new SignalEngineAdminService(new MockSignalEngineRepository());

  it('lists signals and a single signal detail', async () => {
    expect(await service.listSignals()).toHaveLength(signals.length);
    expect(await service.getSignal('SG-FX-CARRY')).not.toBeNull();
    expect(await service.getSignal('nope')).toBeNull();
  });

  it('exposes families and a summary', async () => {
    expect((await service.listFamilies()).length).toBe(families.length);
    expect((await service.getSummary()).totalSignals).toBe(signals.length);
  });

  it('builds the promotion and approval queues', async () => {
    const promotion = await service.getPromotionQueue();
    const approval = await service.getApprovalQueue();
    expect(promotion.some((i) => i.id === 'SG-FX-CARRY')).toBe(true);
    expect(approval.map((i) => i.id)).toContain('SG-RATES-VALUE');
  });
});
