import { describe, it, expect } from 'vitest';
import { applyRiskQuery } from '../src/modules/risk/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/risk/domain/mappers';
import { RiskService } from '../src/modules/risk/application/risk-service';
import { RISK_SEED, MockRiskRepository } from '../src/modules/risk/data/mock-repository';

describe('applyRiskQuery (pure filter/sort/search)', () => {
  it('filters by status and subject kind', () => {
    const escalated = applyRiskQuery(RISK_SEED, { status: 'ESCALATED' });
    expect(escalated.every((a) => a.status === 'ESCALATED')).toBe(true);
    const portfolios = applyRiskQuery(RISK_SEED, { subjectKind: 'PORTFOLIO' });
    expect(portfolios.every((a) => a.subjectKind === 'PORTFOLIO')).toBe(true);
  });

  it('searches across title, subject and tags', () => {
    const results = applyRiskQuery(RISK_SEED, { search: 'carry' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by risk level ascending deterministically', () => {
    const sorted = applyRiskQuery(RISK_SEED, { sortBy: 'riskLevel', sortDir: 'asc' });
    const rank: Record<string, number> = {
      NOT_ASSESSED: 0,
      LOW: 1,
      MODERATE: 2,
      ELEVATED: 3,
      HIGH: 4,
    };
    const ranks = sorted.map((a) => rank[a.riskLevel] ?? 0);
    expect(ranks).toEqual([...ranks].sort((x, y) => x - y));
  });
});

describe('mappers (DTO → view model)', () => {
  it('maps verdict/level tones and subject hrefs by kind', () => {
    const portfolio = RISK_SEED.find((a) => a.subjectKind === 'PORTFOLIO');
    expect(portfolio).toBeDefined();
    const vm = toListItemVm(portfolio!);
    expect(vm.subject.href).toBe(`/portfolios/${portfolio!.subjectId}`);

    const exec = RISK_SEED.find((a) => a.subjectKind === 'EXECUTION_CANDIDATE');
    expect(exec).toBeDefined();
    expect(toListItemVm(exec!).subject.href).toBeUndefined();
  });

  it('maps exposures, constraints, strategy risk links and execution recommendation', () => {
    const escalated = RISK_SEED.find((a) => a.status === 'ESCALATED');
    expect(escalated).toBeDefined();
    const vm = toDetailVm(escalated!);
    expect(vm.executionRecommendation.label).toContain('Do not deploy');
    expect(vm.executionRecommendation.tone).toBe('danger');
    expect(vm.constraints.some((constraint) => constraint.tone === 'danger')).toBe(true);
    expect(vm.strategyRisk.every((entry) => entry.href.startsWith('/strategies/'))).toBe(true);
    expect(vm.policyRefs.length).toBeGreaterThan(0);
  });

  it('aggregates a status summary', () => {
    const summary = toSummaryVm(RISK_SEED);
    expect(summary.total).toBe(RISK_SEED.length);
    expect(summary.byStatus.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(RISK_SEED.length);
  });
});

describe('RiskService (application layer over mock repository)', () => {
  const service = new RiskService(new MockRiskRepository());

  it('lists assessments as view models', async () => {
    const items = await service.listAssessments({});
    expect(items.length).toBe(RISK_SEED.length);
    expect(items[0]).toHaveProperty('verdict');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getAssessment('risk-port-core');
    expect(detail?.subject.name).toBe('Core multi-strategy');
    expect(await service.getAssessment('nope')).toBeNull();
  });

  it('computes a dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(RISK_SEED.length);
  });
});
