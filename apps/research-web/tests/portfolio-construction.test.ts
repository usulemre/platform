import { describe, it, expect } from 'vitest';
import {
  PORTFOLIO_CAPABILITIES,
  PORTFOLIO_STAGES,
  METRIC_CATALOG,
  portfolioKey,
} from '@platform/portfolio-sdk';
import { applyPortfolioQuery } from '../src/modules/portfolio-construction/domain/query';
import {
  toComparisonVm,
  toDetailVm,
  toListItemVm,
  toSummaryVm,
} from '../src/modules/portfolio-construction/domain/mappers';
import { PortfolioConstructionAdminService } from '../src/modules/portfolio-construction/application/portfolio-construction-service';
import {
  MockPortfolioConstructionRepository,
  PORTFOLIO_CONSTRUCTION_SEED,
} from '../src/modules/portfolio-construction/data/mock-repository';

const { portfolios, families, comparisons, templates } = PORTFOLIO_CONSTRUCTION_SEED;
const marketNeutral = portfolios.find((p) => p.id === 'PF-EQUITY-MN')!;

describe('@platform/portfolio-sdk vocabulary is shared', () => {
  it('exposes 10 lifecycle stages, capabilities and a metric catalog', () => {
    expect(PORTFOLIO_STAGES).toHaveLength(10);
    expect(PORTFOLIO_STAGES[0]).toBe('DRAFT');
    expect(PORTFOLIO_STAGES[9]).toBe('ARCHIVED');
    expect(PORTFOLIO_CAPABILITIES.length).toBeGreaterThanOrEqual(12);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
  });
});

describe('applyPortfolioQuery (pure filter/sort/search)', () => {
  it('filters by namespace and stage', () => {
    expect(
      applyPortfolioQuery(portfolios, { namespace: 'credit' }).every(
        (p) => p.namespace === 'credit',
      ),
    ).toBe(true);
    expect(
      applyPortfolioQuery(portfolios, { stage: 'PUBLISHED' }).every((p) => p.stage === 'PUBLISHED'),
    ).toBe(true);
    expect(applyPortfolioQuery(portfolios, { stage: 'APPROVAL' })).toHaveLength(1);
  });

  it('searches across name, namespace, family, owner and tags', () => {
    const result = applyPortfolioQuery(portfolios, { search: 'risk-balanced' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('PF-MULTI-ASSET');
  });
});

describe('mappers (pure DTO → VM)', () => {
  it('maps a list item with stage/optimization/validation tones', () => {
    const vm = toListItemVm(marketNeutral);
    expect(vm.stage.tone).toBe('positive');
    expect(vm.optimization.label).toBe('Completed');
    expect(vm.allocationModel).toBe('signal-weighted');
  });

  it('maps a detail with 10 stage steps, controls, deep-linked deps and lineage', () => {
    const vm = toDetailVm(marketNeutral);
    expect(vm.key).toBe(
      portfolioKey(marketNeutral.namespace, marketNeutral.family, marketNeutral.name),
    );
    expect(vm.stages).toHaveLength(10);
    expect(vm.progress.percent).toBeGreaterThan(0);
    expect(vm.optimizationControls.find((c) => c.control === 'retry')?.enabled).toBe(false);
    expect(vm.dependencies.find((d) => d.kind === 'BACKTEST')?.href).toBe(
      '/backtesting/bt-reversal',
    );
    expect(vm.signalSelection.find((s) => s.name === 'Short-horizon reversal')?.href).toBe(
      '/signals/sig-reversal',
    );
    expect(vm.allocation.holdings.length).toBeGreaterThan(0);
    expect(vm.metrics.length).toBeGreaterThan(0);
    expect(vm.links.some((l) => l.href === '/experiments/exp-momentum-reversal')).toBe(true);
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const vm = toComparisonVm(comparisons[0]!, portfolios);
    expect(vm.rows).toHaveLength(2);
    const row = vm.rows.find((r) => r.portfolioId === 'PF-EQUITY-MN')!;
    expect(row.cells.find((c) => c.key === 'largest_weight')?.value).toBe('2.4%');
  });

  it('summarizes by lifecycle stage and optimization state', () => {
    const summary = toSummaryVm(portfolios, families, comparisons.length, templates.length);
    expect(summary.totalPortfolios).toBe(portfolios.length);
    expect(summary.optimizing).toBe(2);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.templates).toBe(templates.length);
    expect(summary.byStage.every((b) => b.count > 0)).toBe(true);
  });
});

describe('PortfolioConstructionAdminService (over the mock repository)', () => {
  const service = new PortfolioConstructionAdminService(new MockPortfolioConstructionRepository());

  it('lists portfolios and a single detail', async () => {
    expect(await service.listPortfolios()).toHaveLength(portfolios.length);
    expect(await service.getPortfolio('PF-MULTI-ASSET')).not.toBeNull();
    expect(await service.getPortfolio('nope')).toBeNull();
  });

  it('exposes families, templates, queues and comparisons', async () => {
    expect((await service.listFamilies()).length).toBe(families.length);
    expect((await service.listTemplates()).length).toBe(templates.length);
    expect((await service.getOptimizationQueue()).some((i) => i.id === 'PF-CREDIT-CARRY')).toBe(
      true,
    );
    expect((await service.getApprovalQueue()).some((i) => i.id === 'PF-MULTI-ASSET')).toBe(true);
    expect((await service.listComparisons()).length).toBe(comparisons.length);
    expect((await service.getComparison('PCMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
  });

  it('summarizes', async () => {
    expect((await service.getSummary()).totalPortfolios).toBe(portfolios.length);
  });
});
