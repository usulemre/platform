import { create } from 'zustand';
import type { SignalStage } from '@platform/signal-sdk';
import type { SignalSortField, SortDir } from '../domain/query';

/** UI state for the Signal Registry Explorer list controls (Zustand; data is server state). */
interface SignalQueryState {
  readonly search: string;
  readonly namespace: string | 'ALL';
  readonly stage: SignalStage | 'ALL';
  readonly sortBy: SignalSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setNamespace: (namespace: string | 'ALL') => void;
  readonly setStage: (stage: SignalStage | 'ALL') => void;
  readonly setSort: (sortBy: SignalSortField) => void;
}

export const useSignalQueryStore = create<SignalQueryState>((set) => ({
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
