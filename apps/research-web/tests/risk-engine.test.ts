import { describe, it, expect } from 'vitest';
import { RISK_CAPABILITIES, RISK_STAGES, METRIC_CATALOG, assessmentKey } from '@platform/risk-sdk';
import { applyRiskQuery } from '../src/modules/risk-engine/domain/query';
import {
  toComparisonVm,
  toDetailVm,
  toListItemVm,
  toSummaryVm,
} from '../src/modules/risk-engine/domain/mappers';
import { RiskEngineAdminService } from '../src/modules/risk-engine/application/risk-engine-service';
import {
  MockRiskEngineRepository,
  RISK_ENGINE_SEED,
} from '../src/modules/risk-engine/data/mock-repository';

const { assessments, families, policies, comparisons } = RISK_ENGINE_SEED;
const equityMn = assessments.find((a) => a.id === 'RA-EQUITY-MN')!;
const creditCarry = assessments.find((a) => a.id === 'RA-CREDIT-CARRY')!;

describe('@platform/risk-sdk vocabulary is shared', () => {
  it('exposes 9 lifecycle stages, capabilities and a metric catalog', () => {
    expect(RISK_STAGES).toHaveLength(9);
    expect(RISK_STAGES[0]).toBe('DRAFT');
    expect(RISK_STAGES[8]).toBe('ARCHIVED');
    expect(RISK_CAPABILITIES.length).toBeGreaterThanOrEqual(12);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
  });
});

describe('applyRiskQuery (pure filter/sort/search)', () => {
  it('filters by namespace and stage', () => {
    expect(
      applyRiskQuery(assessments, { namespace: 'credit' }).every((a) => a.namespace === 'credit'),
    ).toBe(true);
    expect(applyRiskQuery(assessments, { stage: 'APPROVAL' })).toHaveLength(1);
  });

  it('searches across name, namespace, family, subject, owner and tags', () => {
    const result = applyRiskQuery(assessments, { search: 'multi-asset' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('RA-MULTI-ASSET');
  });
});

describe('mappers (pure DTO → VM)', () => {
  it('maps a list item with decision/stage/validation tones', () => {
    const vm = toListItemVm(equityMn);
    expect(vm.decision.tone).toBe('positive');
    expect(vm.stage.label).toBe('Execution authorized');
    expect(vm.validation.label).toBe('Passed');
  });

  it('maps a detail with 9 stage steps, controls, deep-linked deps and lineage', () => {
    const vm = toDetailVm(creditCarry);
    expect(vm.key).toBe(assessmentKey(creditCarry.namespace, creditCarry.family, creditCarry.name));
    expect(vm.stages).toHaveLength(9);
    expect(vm.progress.percent).toBeGreaterThan(0);
    expect(vm.controls.find((c) => c.control === 'record-override')?.enabled).toBe(true);
    expect(vm.dependencies.find((d) => d.kind === 'PORTFOLIO')?.href).toBe(
      '/portfolio-construction/pf-credit-carry',
    );
    expect(vm.limits.some((l) => l.status.label === 'Breached')).toBe(true);
    expect(vm.exceptions.length).toBeGreaterThan(0);
    expect(vm.subject.href).toBe('/portfolio-construction/pf-credit-carry');
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const vm = toComparisonVm(comparisons[0]!, assessments);
    expect(vm.rows).toHaveLength(2);
    const row = vm.rows.find((r) => r.assessmentId === 'RA-EQUITY-MN')!;
    expect(row.cells.find((c) => c.key === 'leverage')?.value).toBe('2.0x');
  });

  it('summarizes by lifecycle stage, queues, exceptions and overrides', () => {
    const summary = toSummaryVm(assessments, families.length, policies.length);
    expect(summary.totalAssessments).toBe(assessments.length);
    expect(summary.inValidation).toBe(2);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.openExceptions).toBe(2);
    expect(summary.activeOverrides).toBe(1);
    expect(summary.blocked).toBe(1);
    expect(summary.byStage.every((b) => b.count > 0)).toBe(true);
  });
});

describe('RiskEngineAdminService (over the mock repository)', () => {
  const service = new RiskEngineAdminService(new MockRiskEngineRepository());

  it('lists assessments and a single detail', async () => {
    expect(await service.listAssessments()).toHaveLength(assessments.length);
    expect(await service.getAssessment('RA-MULTI-ASSET')).not.toBeNull();
    expect(await service.getAssessment('nope')).toBeNull();
  });

  it('exposes policies, queues, exposures, reports and comparisons', async () => {
    expect((await service.listPolicies()).length).toBe(policies.length);
    expect((await service.getValidationQueue()).some((i) => i.id === 'RA-CREDIT-CARRY')).toBe(true);
    expect((await service.getApprovalQueue()).some((i) => i.id === 'RA-MULTI-ASSET')).toBe(true);
    expect((await service.getExceptionQueue()).length).toBe(2);
    expect((await service.getExposureSummary()).length).toBeGreaterThan(0);
    expect((await service.getReports()).length).toBeGreaterThan(0);
    expect((await service.getComparison('RCMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
  });

  it('summarizes', async () => {
    expect((await service.getSummary()).totalAssessments).toBe(assessments.length);
  });
});
