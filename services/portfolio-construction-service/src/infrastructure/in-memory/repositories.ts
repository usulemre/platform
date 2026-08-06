/**
 * In-memory read-model adapters. Development/test only — no persistence, no cache,
 * no database. They implement the query ports over the synthetic seed.
 */
import type {
  Portfolio,
  PortfolioComparison,
  PortfolioFamily,
  PortfolioTemplate,
} from '@platform/portfolio-sdk';
import type {
  ComparisonQueryPort,
  FamilyQueryPort,
  PortfolioQueryPort,
  TemplateQueryPort,
} from '../ports';
import { COMPARISONS, FAMILIES, PORTFOLIOS, TEMPLATES } from './seed';

export class InMemoryPortfolioQuery implements PortfolioQueryPort {
  constructor(private readonly data: readonly Portfolio[] = PORTFOLIOS) {}
  async list(): Promise<readonly Portfolio[]> {
    return this.data;
  }
  async getById(id: string): Promise<Portfolio | null> {
    return this.data.find((portfolio) => portfolio.id === id) ?? null;
  }
}

export class InMemoryFamilyQuery implements FamilyQueryPort {
  constructor(private readonly data: readonly PortfolioFamily[] = FAMILIES) {}
  async list(): Promise<readonly PortfolioFamily[]> {
    return this.data;
  }
}

export class InMemoryComparisonQuery implements ComparisonQueryPort {
  constructor(private readonly data: readonly PortfolioComparison[] = COMPARISONS) {}
  async list(): Promise<readonly PortfolioComparison[]> {
    return this.data;
  }
  async getById(id: string): Promise<PortfolioComparison | null> {
    return this.data.find((comparison) => comparison.id === id) ?? null;
  }
}

export class InMemoryTemplateQuery implements TemplateQueryPort {
  constructor(private readonly data: readonly PortfolioTemplate[] = TEMPLATES) {}
  async list(): Promise<readonly PortfolioTemplate[]> {
    return this.data;
  }
}
