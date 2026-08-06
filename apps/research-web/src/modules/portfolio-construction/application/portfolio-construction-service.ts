/**
 * Portfolio-construction application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. No
 * infrastructure, no optimizer, no weight calculation, no risk computation, no
 * persistence. Aggregation and comparison assembly are pure lookups/reshapes.
 */
import {
  toApprovalQueueItemVm,
  toComparisonListItemVm,
  toComparisonVm,
  toDetailVm,
  toFamilyVm,
  toListItemVm,
  toOptimizationQueueItemVm,
  toOptimizationRequestQueueItemVm,
  toSummaryVm,
  toTemplateVm,
} from '../domain/mappers';
import type { PortfolioQuery } from '../domain/query';
import type {
  ComparisonListItemVm,
  ComparisonVm,
  OptimizationRequestQueueItemVm,
  PortfolioConstructionSummaryVm,
  PortfolioDetailVm,
  PortfolioFamilyVm,
  PortfolioListItemVm,
  PortfolioTemplateVm,
  QueueItemVm,
} from '../domain/view-model';
import type { PortfolioConstructionRepository } from '../data/repository';

export class PortfolioConstructionAdminService {
  constructor(private readonly repository: PortfolioConstructionRepository) {}

  async listPortfolios(query: PortfolioQuery = {}): Promise<PortfolioListItemVm[]> {
    return (await this.repository.listPortfolios(query)).map(toListItemVm);
  }

  async getPortfolio(id: string): Promise<PortfolioDetailVm | null> {
    const portfolio = await this.repository.getPortfolio(id);
    return portfolio ? toDetailVm(portfolio) : null;
  }

  async listFamilies(): Promise<PortfolioFamilyVm[]> {
    return (await this.repository.listFamilies()).map(toFamilyVm);
  }

  async listTemplates(): Promise<PortfolioTemplateVm[]> {
    return (await this.repository.listTemplates()).map(toTemplateVm);
  }

  async getOptimizationQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.optimizationQueue()).map(toOptimizationQueueItemVm);
  }

  async getOptimizationRequests(): Promise<OptimizationRequestQueueItemVm[]> {
    return (await this.repository.optimizationQueue()).map(toOptimizationRequestQueueItemVm);
  }

  async getApprovalQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.approvalQueue()).map(toApprovalQueueItemVm);
  }

  async listComparisons(): Promise<ComparisonListItemVm[]> {
    return (await this.repository.listComparisons()).map(toComparisonListItemVm);
  }

  async getComparison(id: string): Promise<ComparisonVm | null> {
    const comparison = await this.repository.getComparison(id);
    if (!comparison) return null;
    const portfolios = await this.repository.listPortfolios({});
    return toComparisonVm(comparison, portfolios);
  }

  async getSummary(): Promise<PortfolioConstructionSummaryVm> {
    const [portfolios, families, comparisons, templates] = await Promise.all([
      this.repository.listPortfolios({}),
      this.repository.listFamilies(),
      this.repository.listComparisons(),
      this.repository.listTemplates(),
    ]);
    return toSummaryVm(portfolios, families, comparisons.length, templates.length);
  }
}
