import { create } from 'zustand';
import type { RiskStage } from '@platform/risk-sdk';
import type { RiskSortField, SortDir } from '../domain/query';

/** UI state for the Risk Registry list controls (Zustand; data is server state). */
interface RiskQueryState {
  readonly search: string;
  readonly namespace: string | 'ALL';
  readonly stage: RiskStage | 'ALL';
  readonly sortBy: RiskSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setNamespace: (namespace: string | 'ALL') => void;
  readonly setStage: (stage: RiskStage | 'ALL') => void;
  readonly setSort: (sortBy: RiskSortField) => void;
}

export const useRiskQueryStore = create<RiskQueryState>((set) => ({
  search: '',
  namespace: 'ALL',
  stage: 'ALL',
  sortBy: 'name',
  sortDir: 'asc',
  setSearch: (search) => set({ search }),
  setNamespace: (namespace) => set({ namespace }),
  setStage: (stage) => set({ stage }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
}));
