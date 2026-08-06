/**
 * Real adapter over the governed API gateway (backtesting service). NOT wired in
 * v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never a broker, never a simulation runner, never persistence.
 */
import type { ApiClient } from '@platform/api-client';
import type { Backtest, BacktestComparison, BacktestFamily } from '@platform/backtesting-sdk';
import type { BacktestQuery } from '../domain/query';
import type { BacktestingRepository } from './repository';

function buildQueryString(query: BacktestQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.namespace && query.namespace !== 'ALL') params.set('namespace', query.namespace);
  if (query.stage && query.stage !== 'ALL') params.set('stage', query.stage);
  if (query.scenario && query.scenario !== 'ALL') params.set('scenario', query.scenario);
  if (query.tag) params.set('tag', query.tag);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiBacktestingRepository implements BacktestingRepository {
  constructor(private readonly api: ApiClient) {}

  listBacktests(query: BacktestQuery): Promise<readonly Backtest[]> {
    return this.api.request<readonly Backtest[]>(
      `/backtesting/backtests${buildQueryString(query)}`,
    );
  }

  async getBacktest(id: string): Promise<Backtest | null> {
    try {
      return await this.api.request<Backtest>(`/backtesting/backtests/${id}`);
    } catch {
      return null;
    }
  }

  listFamilies(): Promise<readonly BacktestFamily[]> {
    return this.api.request<readonly BacktestFamily[]>('/backtesting/families');
  }

  executionQueue(): Promise<readonly Backtest[]> {
    return this.api.request<readonly Backtest[]>('/backtesting/queues/execution');
  }

  approvalQueue(): Promise<readonly Backtest[]> {
    return this.api.request<readonly Backtest[]>('/backtesting/queues/approval');
  }

  listComparisons(): Promise<readonly BacktestComparison[]> {
    return this.api.request<readonly BacktestComparison[]>('/backtesting/comparisons');
  }

  async getComparison(id: string): Promise<BacktestComparison | null> {
    try {
      return await this.api.request<BacktestComparison>(`/backtesting/comparisons/${id}`);
    } catch {
      return null;
    }
  }
}
