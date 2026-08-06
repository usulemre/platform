import { describe, it, expect } from 'vitest';
import { applyPortfolioQuery } from '../src/modules/portfolio/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/portfolio/domain/mappers';
import { PortfolioService } from '../src/modules/portfolio/application/portfolio-service';
import {
  PORTFOLIO_SEED,
  MockPortfolioRepository,
} from '../src/modules/portfolio/data/mock-repository';

describe('applyPortfolioQuery (pure filter/sort/search)', () => {
  it('filters by status and asset class', () => {
    const approved = applyPortfolioQuery(PORTFOLIO_SEED, { status: 'APPROVED' });
    expect(approved.every((p) => p.status === 'APPROVED')).toBe(true);
    const equity = applyPortfolioQuery(PORTFOLIO_SEED, { assetClass: 'EQUITY' });
    expect(equity.every((p) => p.assetClass === 'EQUITY')).toBe(true);
  });

  it('searches across name, mandate and tags', () => {
    const results = applyPortfolioQuery(PORTFOLIO_SEED, { search: 'neutral' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by name ascending deterministically', () => {
    const sorted = applyPortfolioQuery(PORTFOLIO_SEED, { sortBy: 'name', sortDir: 'asc' });
    const names = sorted.map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (DTO → view model)', () => {
  it('maps deployment mode (proposed; never authorizes live from console)', () => {
    const paper = PORTFOLIO_SEED.find((p) => p.deploymentMode === 'PAPER');
    expect(paper).toBeDefined();
    const vm = toListItemVm(paper!);
    expect(vm.deployment.label).toContain('Paper');
    expect(vm.deployment.tone).toBe('info');
  });

  it('maps constraints/risk statuses, holdings, allocations and links composition', () => {
    const approved = PORTFOLIO_SEED.find((p) => p.status === 'APPROVED');
    expect(approved).toBeDefined();
    const vm = toDetailVm(approved!);
    expect(vm.composition.every((entry) => entry.href.startsWith('/strategies/'))).toBe(true);
    expect(vm.experimentRefs.every((ref) => ref.href?.startsWith('/experiments/'))).toBe(true);
    expect(vm.constraints.some((constraint) => constraint.tone === 'danger')).toBe(true); // a breached constraint
    expect(vm.holdings.length).toBeGreaterThan(0);
    expect(vm.allocations.length).toBeGreaterThan(0);
    expect(vm.risk.length).toBeGreaterThan(0);
  });

  it('aggregates a status summary', () => {
    const summary = toSummaryVm(PORTFOLIO_SEED);
    expect(summary.total).toBe(PORTFOLIO_SEED.length);
    expect(summary.byStatus.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(
      PORTFOLIO_SEED.length,
    );
  });
});

describe('PortfolioService (application layer over mock repository)', () => {
  const service = new PortfolioService(new MockPortfolioRepository());

  it('lists portfolios as view models', async () => {
    const items = await service.listPortfolios({});
    expect(items.length).toBe(PORTFOLIO_SEED.length);
    expect(items[0]).toHaveProperty('deployment');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getPortfolio('port-core');
    expect(detail?.name).toBe('Core multi-strategy');
    expect(await service.getPortfolio('nope')).toBeNull();
  });

  it('computes a dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(PORTFOLIO_SEED.length);
  });
});
