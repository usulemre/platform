import { describe, it, expect } from 'vitest';
import {
  PORTFOLIO_CAPABILITIES,
  PORTFOLIO_STAGES,
  METRIC_CATALOG,
  portfolioKey,
  canCancel,
  canRetry,
  describeStage,
  nextStage,
} from '@platform/portfolio-sdk';
import { resolveByKey, searchPortfolios } from '../src/domain/discovery';
import {
  isOptimizationCancellable,
  isOptimizationRetryable,
  overallApproval,
} from '../src/domain/lifecycle';
import {
  approvalQueue,
  assembleComparison,
  currentVersion,
  optimizationQueue,
} from '../src/domain/derivations';
import { createPortfolioConstructionService } from '../src/composition';
import { PORTFOLIOS, COMPARISONS } from '../src/infrastructure/in-memory/seed';

const AT = '2026-08-03T00:00:00.000Z';
const marketNeutral = PORTFOLIOS.find((p) => p.id === 'PF-EQUITY-MN')!;
const creditCarry = PORTFOLIOS.find((p) => p.id === 'PF-CREDIT-CARRY')!;
const cancelled = PORTFOLIOS.find((p) => p.id === 'PF-VOL-CANCELLED')!;

describe('@platform/portfolio-sdk vocabulary', () => {
  it('orders 10 lifecycle stages draft → archived', () => {
    expect(PORTFOLIO_STAGES).toHaveLength(10);
    expect(PORTFOLIO_STAGES[0]).toBe('DRAFT');
    expect(PORTFOLIO_STAGES[9]).toBe('ARCHIVED');
    expect(nextStage('ARCHIVED')).toBeNull();
    expect(describeStage('APPROVAL').gate).toBe(true);
    expect(describeStage('VALIDATION').gate).toBe(true);
    expect(describeStage('REVIEW').gate).toBe(true);
  });

  it('exposes capabilities, a metric catalog and a canonical key', () => {
    expect(PORTFOLIO_CAPABILITIES.length).toBeGreaterThanOrEqual(12);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
    expect(portfolioKey('Equities', 'Market Neutral', 'Equity MN')).toBe(
      'equities/market-neutral/equity-mn',
    );
  });

  it('exposes optimization-control predicates', () => {
    expect(canCancel('RUNNING')).toBe(true);
    expect(canRetry('CANCELLED')).toBe(true);
    expect(canCancel('COMPLETED')).toBe(false);
    expect(canRetry('RUNNING')).toBe(false);
  });
});

describe('discovery (pure filter/search)', () => {
  it('filters by namespace and stage', () => {
    expect(
      searchPortfolios(PORTFOLIOS, { namespace: 'credit' }).every((p) => p.namespace === 'credit'),
    ).toBe(true);
    expect(
      searchPortfolios(PORTFOLIOS, { stage: 'PUBLISHED' }).every((p) => p.stage === 'PUBLISHED'),
    ).toBe(true);
    expect(searchPortfolios(PORTFOLIOS, { stage: 'APPROVAL' })).toHaveLength(1);
  });

  it('resolves a portfolio by its canonical key', () => {
    const key = portfolioKey(marketNeutral.namespace, marketNeutral.family, marketNeutral.name);
    expect(resolveByKey(PORTFOLIOS, key)?.id).toBe('PF-EQUITY-MN');
    expect(resolveByKey(PORTFOLIOS, 'nope/none/none')).toBeNull();
  });
});

describe('lifecycle + derivations (pure)', () => {
  it('gates optimization controls by request state', () => {
    expect(isOptimizationCancellable(creditCarry)).toBe(true);
    expect(isOptimizationRetryable(cancelled)).toBe(true);
    expect(isOptimizationCancellable(marketNeutral)).toBe(false);
  });

  it('derives overall approval and the queues', () => {
    expect(overallApproval(marketNeutral)).toBe('APPROVED');
    expect(optimizationQueue(PORTFOLIOS).some((p) => p.id === 'PF-CREDIT-CARRY')).toBe(true);
    expect(approvalQueue(PORTFOLIOS).some((p) => p.id === 'PF-MULTI-ASSET')).toBe(true);
    expect(currentVersion(marketNeutral)?.version).toBe('2.0.0');
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const assembled = assembleComparison(COMPARISONS[0]!, PORTFOLIOS);
    expect(assembled.rows).toHaveLength(2);
    expect(assembled.rows[0]!.values.largest_weight).toBe('2.4%');
    expect(
      assembled.rows.find((r) => r.portfolioId === 'PF-MULTI-ASSET')?.values.largest_weight,
    ).toBe('34%');
  });
});

describe('PortfolioConstructionService (over in-memory ports)', () => {
  const service = createPortfolioConstructionService();

  it('lists the registry and one portfolio', async () => {
    expect(await service.listPortfolios()).toHaveLength(PORTFOLIOS.length);
    expect(await service.getPortfolio('PF-MULTI-ASSET')).not.toBeNull();
    expect(await service.getPortfolio('nope')).toBeNull();
  });

  it('summarizes by stage, optimization state, templates and families', async () => {
    const summary = await service.getSummary();
    expect(summary.totalPortfolios).toBe(PORTFOLIOS.length);
    expect(summary.optimizing).toBe(2);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.families).toBe(5);
    expect(summary.templates).toBe(3);
    expect(summary.byStage.length).toBeGreaterThan(0);
  });

  it('assembles a comparison and exposes the metric catalog', async () => {
    expect(service.metricCatalog().length).toBe(METRIC_CATALOG.length);
    expect((await service.getComparison('PCMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
  });

  it('applies optimization controls only when permitted; false otherwise', async () => {
    expect(await service.controlOptimization('PF-CREDIT-CARRY', 'cancel', AT)).toBe(true);
    expect(await service.controlOptimization('PF-CREDIT-CARRY', 'retry', AT)).toBe(false);
    expect(await service.controlOptimization('PF-VOL-CANCELLED', 'retry', AT)).toBe(true);
    expect(await service.controlOptimization('nope', 'cancel', AT)).toBe(false);
  });

  it('records optimization/review/approval/rebalance requests; false for unknown', async () => {
    expect(await service.requestOptimization('PF-FX-MOM-DRAFT', AT)).toBe(true);
    expect(await service.requestReview('PF-MULTI-ASSET', AT)).toBe(true);
    expect(await service.requestApproval('PF-MULTI-ASSET', AT)).toBe(true);
    expect(await service.requestRebalance('PF-EQUITY-MN', AT)).toBe(true);
    expect(await service.requestOptimization('nope', AT)).toBe(false);
  });

  it('reflects validation and risk status decided elsewhere', async () => {
    expect(await service.isValidated('PF-EQUITY-MN')).toBe(true);
    expect(await service.isValidated('PF-FX-MOM-DRAFT')).toBe(false);
    expect(await service.isRiskCleared('PF-EQUITY-MN')).toBe(true);
  });
});
