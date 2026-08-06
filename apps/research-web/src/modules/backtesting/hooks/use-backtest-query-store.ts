import { create } from 'zustand';
import type { BacktestStage, ScenarioKind } from '@platform/backtesting-sdk';
import type { BacktestSortField, SortDir } from '../domain/query';

/** UI state for the Backtest Registry list controls (Zustand; data is server state). */
interface BacktestQueryState {
  readonly search: string;
  readonly namespace: string | 'ALL';
  readonly stage: BacktestStage | 'ALL';
  readonly scenario: ScenarioKind | 'ALL';
  readonly sortBy: BacktestSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setNamespace: (namespace: string | 'ALL') => void;
  readonly setStage: (stage: BacktestStage | 'ALL') => void;
  readonly setScenario: (scenario: ScenarioKind | 'ALL') => void;
  readonly setSort: (sortBy: BacktestSortField) => void;
}

export const useBacktestQueryStore = create<BacktestQueryState>((set) => ({
  search: '',
  namespace: 'ALL',
  stage: 'ALL',
  scenario: 'ALL',
  sortBy: 'name',
  sortDir: 'asc',
  setSearch: (search) => set({ search }),
  setNamespace: (namespace) => set({ namespace }),
  setStage: (stage) => set({ stage }),
  setScenario: (scenario) => set({ scenario }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
}));
