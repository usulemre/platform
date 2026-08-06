/**
 * In-memory read-model adapters. Development/test only — no persistence, no
 * cache, no database. They implement the query ports over the synthetic seed.
 */
import type { Backtest, BacktestComparison, BacktestFamily } from '@platform/backtesting-sdk';
import type { BacktestQueryPort, ComparisonQueryPort, FamilyQueryPort } from '../ports';
import { BACKTESTS, COMPARISONS, FAMILIES } from './seed';

export class InMemoryBacktestQuery implements BacktestQueryPort {
  constructor(private readonly data: readonly Backtest[] = BACKTESTS) {}
  async list(): Promise<readonly Backtest[]> {
    return this.data;
  }
  async getById(id: string): Promise<Backtest | null> {
    return this.data.find((backtest) => backtest.id === id) ?? null;
  }
}

export class InMemoryFamilyQuery implements FamilyQueryPort {
  constructor(private readonly data: readonly BacktestFamily[] = FAMILIES) {}
  async list(): Promise<readonly BacktestFamily[]> {
    return this.data;
  }
}

export class InMemoryComparisonQuery implements ComparisonQueryPort {
  constructor(private readonly data: readonly BacktestComparison[] = COMPARISONS) {}
  async list(): Promise<readonly BacktestComparison[]> {
    return this.data;
  }
  async getById(id: string): Promise<BacktestComparison | null> {
    return this.data.find((comparison) => comparison.id === id) ?? null;
  }
}
