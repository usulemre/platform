import { describe, it, expect } from 'vitest';
import {
  RISK_CAPABILITIES,
  RISK_STAGES,
  METRIC_CATALOG,
  assessmentKey,
  canRevalidate,
  describeStage,
  isExceptionOpen,
  isOverrideActive,
  nextStage,
} from '@platform/risk-sdk';
import { resolveByKey, searchAssessments } from '../src/domain/discovery';
import {
  canRecordOverride,
  hasOpenExceptions,
  isRevalidatable,
  overallApproval,
} from '../src/domain/lifecycle';
import {
  approvalQueue,
  assembleComparison,
  currentVersion,
  exceptionQueue,
  reviewQueue,
  validationQueue,
} from '../src/domain/derivations';
import { createRiskEngineService } from '../src/composition';
import { ASSESSMENTS, COMPARISONS } from '../src/infrastructure/in-memory/seed';

const AT = '2026-08-03T00:00:00.000Z';
const equityMn = ASSESSMENTS.find((a) => a.id === 'RA-EQUITY-MN')!;
const creditCarry = ASSESSMENTS.find((a) => a.id === 'RA-CREDIT-CARRY')!;

describe('@platform/risk-sdk vocabulary', () => {
  it('orders 9 lifecycle stages draft → archived', () => {
    expect(RISK_STAGES).toHaveLength(9);
    expect(RISK_STAGES[0]).toBe('DRAFT');
    expect(RISK_STAGES[8]).toBe('ARCHIVED');
    expect(nextStage('ARCHIVED')).toBeNull();
    expect(describeStage('APPROVAL').gate).toBe(true);
    expect(describeStage('POLICY_VALIDATION').gate).toBe(true);
    expect(describeStage('LIMIT_VALIDATION').gate).toBe(true);
  });

  it('exposes capabilities, a metric catalog and a canonical key', () => {
    expect(RISK_CAPABILITIES.length).toBeGreaterThanOrEqual(12);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
    expect(assessmentKey('Equities', 'Market Neutral', 'Equity MN')).toBe(
      'equities/market-neutral/equity-mn',
    );
  });

  it('exposes pure governance predicates', () => {
    expect(canRevalidate('POLICY_VALIDATION')).toBe(true);
    expect(canRevalidate('ARCHIVED')).toBe(false);
    expect(isExceptionOpen('OPEN')).toBe(true);
    expect(isOverrideActive('ACTIVE')).toBe(true);
  });
});

describe('discovery (pure filter/search)', () => {
  it('filters by namespace and stage', () => {
    expect(
      searchAssessments(ASSESSMENTS, { namespace: 'credit' }).every(
        (a) => a.namespace === 'credit',
      ),
    ).toBe(true);
    expect(searchAssessments(ASSESSMENTS, { stage: 'APPROVAL' })).toHaveLength(1);
  });

  it('resolves an assessment by its canonical key', () => {
    const key = assessmentKey(equityMn.namespace, equityMn.family, equityMn.name);
    expect(resolveByKey(ASSESSMENTS, key)?.id).toBe('RA-EQUITY-MN');
    expect(resolveByKey(ASSESSMENTS, 'nope/none/none')).toBeNull();
  });
});

describe('lifecycle + derivations (pure)', () => {
  it('gates governance controls by state', () => {
    expect(isRevalidatable(creditCarry)).toBe(true);
    expect(canRecordOverride(creditCarry)).toBe(true);
    expect(hasOpenExceptions(creditCarry)).toBe(true);
    expect(canRecordOverride(equityMn)).toBe(false);
  });

  it('derives overall approval and the queues', () => {
    expect(overallApproval(equityMn)).toBe('APPROVED');
    expect(validationQueue(ASSESSMENTS).some((a) => a.id === 'RA-CREDIT-CARRY')).toBe(true);
    expect(validationQueue(ASSESSMENTS).some((a) => a.id === 'RA-FX-MOM')).toBe(true);
    expect(reviewQueue(ASSESSMENTS).some((a) => a.id === 'RA-VOL-BLOCKED')).toBe(true);
    expect(approvalQueue(ASSESSMENTS).some((a) => a.id === 'RA-MULTI-ASSET')).toBe(true);
    expect(exceptionQueue(ASSESSMENTS).length).toBe(2);
    expect(currentVersion(equityMn)?.version).toBe('2.0.0');
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const assembled = assembleComparison(COMPARISONS[0]!, ASSESSMENTS);
    expect(assembled.rows).toHaveLength(2);
    expect(assembled.rows[0]!.values.leverage).toBe('2.0x');
    expect(assembled.rows.find((r) => r.assessmentId === 'RA-MULTI-ASSET')?.values.leverage).toBe(
      '1.4x',
    );
  });
});

describe('RiskEngineService (over in-memory ports)', () => {
  const service = createRiskEngineService();

  it('lists the registry and one assessment', async () => {
    expect(await service.listAssessments()).toHaveLength(ASSESSMENTS.length);
    expect(await service.getAssessment('RA-MULTI-ASSET')).not.toBeNull();
    expect(await service.getAssessment('nope')).toBeNull();
  });

  it('summarizes by stage, queues, exceptions, overrides and policies', async () => {
    const summary = await service.getSummary();
    expect(summary.totalAssessments).toBe(ASSESSMENTS.length);
    expect(summary.inValidation).toBe(2);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.openExceptions).toBe(2);
    expect(summary.activeOverrides).toBe(1);
    expect(summary.blocked).toBe(1);
    expect(summary.families).toBe(5);
    expect(summary.policies).toBeGreaterThan(0);
  });

  it('assembles a comparison and exposes the metric catalog', async () => {
    expect(service.metricCatalog().length).toBe(METRIC_CATALOG.length);
    expect((await service.getComparison('RCMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
  });

  it('applies governance controls only when permitted; false otherwise', async () => {
    expect(await service.applyControl('RA-CREDIT-CARRY', 'record-override', AT)).toBe(true);
    expect(await service.applyControl('RA-EQUITY-MN', 'record-override', AT)).toBe(false);
    expect(await service.applyControl('RA-CREDIT-CARRY', 'revalidate', AT)).toBe(true);
    expect(await service.applyControl('nope', 'revalidate', AT)).toBe(false);
  });

  it('records assessment/validation/review/approval requests; false for unknown', async () => {
    expect(await service.requestAssessment('RA-FX-MOM', AT)).toBe(true);
    expect(await service.requestPolicyValidation('RA-FX-MOM', AT)).toBe(true);
    expect(await service.requestLimitValidation('RA-CREDIT-CARRY', AT)).toBe(true);
    expect(await service.requestReview('RA-VOL-BLOCKED', AT)).toBe(true);
    expect(await service.requestApproval('RA-MULTI-ASSET', AT)).toBe(true);
    expect(await service.requestAssessment('nope', AT)).toBe(false);
  });

  it('reflects validation status decided elsewhere', async () => {
    expect(await service.isValidated('RA-EQUITY-MN')).toBe(true);
    expect(await service.isValidated('RA-VOL-BLOCKED')).toBe(false);
  });
});
