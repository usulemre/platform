import { create } from 'zustand';
import type { SimulationStage } from '@platform/execution-sdk';
import type { SessionSortField, SortDir } from '../domain/query';

/** UI state for the Simulation Sessions list controls (Zustand; data is server state). */
interface SessionQueryState {
  readonly search: string;
  readonly namespace: string | 'ALL';
  readonly stage: SimulationStage | 'ALL';
  readonly sortBy: SessionSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setNamespace: (namespace: string | 'ALL') => void;
  readonly setStage: (stage: SimulationStage | 'ALL') => void;
  readonly setSort: (sortBy: SessionSortField) => void;
}

export const useSessionQueryStore = create<SessionQueryState>((set) => ({
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
