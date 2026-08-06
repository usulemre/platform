/**
 * Backtesting application service — the ONLY layer the UI/hooks call. Orchestrates
 * the repository and maps canonical DTOs to view models. No infrastructure, no
 * simulation, no performance-metric computation, no optimization, no persistence.
 * Aggregation and comparison assembly are pure lookups/reshapes.
 */
import {
  toApprovalQueueItemVm,
  toComparisonListItemVm,
  toComparisonVm,
  toDetailVm,
  toExecutionQueueItemVm,
  toFamilyVm,
  toListItemVm,
  toSummaryVm,
} from '../domain/mappers';
import type { BacktestQuery } from '../domain/query';
import type {
  BacktestDetailVm,
  BacktestFamilyVm,
  BacktestListItemVm,
  BacktestingSummaryVm,
  ComparisonListItemVm,
  ComparisonVm,
  QueueItemVm,
} from '../domain/view-model';
import type { BacktestingRepository } from '../data/repository';

export class BacktestingAdminService {
  constructor(private readonly repository: BacktestingRepository) {}

  async listBacktests(query: BacktestQuery = {}): Promise<BacktestListItemVm[]> {
    return (await this.repository.listBacktests(query)).map(toListItemVm);
  }

  async getBacktest(id: string): Promise<BacktestDetailVm | null> {
    const backtest = await this.repository.getBacktest(id);
    return backtest ? toDetailVm(backtest) : null;
  }

  async listFamilies(): Promise<BacktestFamilyVm[]> {
    return (await this.repository.listFamilies()).map(toFamilyVm);
  }

  async getExecutionQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.executionQueue()).map(toExecutionQueueItemVm);
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
    const backtests = await this.repository.listBacktests({});
    return toComparisonVm(comparison, backtests);
  }

  async getSummary(): Promise<BacktestingSummaryVm> {
    const [backtests, families, comparisons] = await Promise.all([
      this.repository.listBacktests({}),
      this.repository.listFamilies(),
      this.repository.listComparisons(),
    ]);
    return toSummaryVm(backtests, families, comparisons.length);
  }
}
