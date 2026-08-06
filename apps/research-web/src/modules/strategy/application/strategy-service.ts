/**
 * Strategy application service — the ONLY layer the UI/hooks call. Orchestrates
 * the repository, maps canonical DTOs to view models, and computes the dashboard
 * summary (pure aggregation — NOT statistics). No infrastructure, no UI, no
 * trading algorithms, no optimization. Strategies are advisory until approved for
 * portfolio construction; approval runs through governed workflows (WCON-2).
 */
import type { StrategyDetailVm, StrategyListItemVm, StrategySummaryVm } from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import type { StrategyQuery } from '../domain/query';
import type { StrategyRepository } from '../data/repository';

export class StrategyService {
  constructor(private readonly repository: StrategyRepository) {}

  async listStrategies(query: StrategyQuery = {}): Promise<StrategyListItemVm[]> {
    const strategies = await this.repository.list(query);
    return strategies.map(toListItemVm);
  }

  async getStrategy(id: string): Promise<StrategyDetailVm | null> {
    const strategy = await this.repository.getById(id);
    return strategy ? toDetailVm(strategy) : null;
  }

  async getSummary(): Promise<StrategySummaryVm> {
    const strategies = await this.repository.list({});
    return toSummaryVm(strategies);
  }
}
