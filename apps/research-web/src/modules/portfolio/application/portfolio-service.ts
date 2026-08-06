/**
 * Portfolio application service — the ONLY layer the UI/hooks call. Orchestrates
 * the repository, maps canonical DTOs to view models, and computes the dashboard
 * summary (pure aggregation — NOT statistics). No infrastructure, no UI, no
 * optimization, no position sizing. Portfolios are proposed allocations; approval
 * and any deployment run through governed workflows (WCON-2) — never here.
 */
import type {
  PortfolioDetailVm,
  PortfolioListItemVm,
  PortfolioSummaryVm,
} from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import type { PortfolioQuery } from '../domain/query';
import type { PortfolioRepository } from '../data/repository';

export class PortfolioService {
  constructor(private readonly repository: PortfolioRepository) {}

  async listPortfolios(query: PortfolioQuery = {}): Promise<PortfolioListItemVm[]> {
    const portfolios = await this.repository.list(query);
    return portfolios.map(toListItemVm);
  }

  async getPortfolio(id: string): Promise<PortfolioDetailVm | null> {
    const portfolio = await this.repository.getById(id);
    return portfolio ? toDetailVm(portfolio) : null;
  }

  async getSummary(): Promise<PortfolioSummaryVm> {
    const portfolios = await this.repository.list({});
    return toSummaryVm(portfolios);
  }
}
