import { create } from 'zustand';
import type { PortfolioStage } from '@platform/portfolio-sdk';
import type { PortfolioSortField, SortDir } from '../domain/query';

/** UI state for the Portfolio Registry list controls (Zustand; data is server state). */
interface PortfolioQueryState {
  readonly search: string;
  readonly namespace: string | 'ALL';
  readonly stage: PortfolioStage | 'ALL';
  readonly sortBy: PortfolioSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setNamespace: (namespace: string | 'ALL') => void;
  readonly setStage: (stage: PortfolioStage | 'ALL') => void;
  readonly setSort: (sortBy: PortfolioSortField) => void;
}

export const usePortfolioQueryStore = create<PortfolioQueryState>((set) => ({
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
