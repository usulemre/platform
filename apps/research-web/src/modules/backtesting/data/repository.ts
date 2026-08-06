/**
 * Backtesting Engine repository boundary — the ONLY data abstraction the
 * application service depends on. Concrete adapters implement it; the UI never
 * sees a concrete data source and never touches the service tier, a broker, a
 * simulation runner, or persistence.
 */
import type { Backtest, BacktestComparison, BacktestFamily } from '@platform/backtesting-sdk';
import type { BacktestQuery } from '../domain/query';

export type { BacktestQuery };

export interface BacktestingRepository {
  listBacktests(query: BacktestQuery): Promise<readonly Backtest[]>;
  getBacktest(id: string): Promise<Backtest | null>;
  listFamilies(): Promise<readonly BacktestFamily[]>;
  executionQueue(): Promise<readonly Backtest[]>;
  approvalQueue(): Promise<readonly Backtest[]>;
  listComparisons(): Promise<readonly BacktestComparison[]>;
  getComparison(id: string): Promise<BacktestComparison | null>;
}
