import { create } from 'zustand';
import type { FeatureLifecycleStatus } from '@platform/feature-store-sdk';
import type { FeatureSortField, SortDir } from '../domain/query';

/** UI state for the Feature Explorer list controls (Zustand; data is server state). */
interface FeatureQueryState {
  readonly search: string;
  readonly namespace: string | 'ALL';
  readonly status: FeatureLifecycleStatus | 'ALL';
  readonly sortBy: FeatureSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setNamespace: (namespace: string | 'ALL') => void;
  readonly setStatus: (status: FeatureLifecycleStatus | 'ALL') => void;
  readonly setSort: (sortBy: FeatureSortField) => void;
}

export const useFeatureQueryStore = create<FeatureQueryState>((set) => ({
  search: '',
  namespace: 'ALL',
  status: 'ALL',
  sortBy: 'name',
  sortDir: 'asc',
  setSearch: (search) => set({ search }),
  setNamespace: (namespace) => set({ namespace }),
  setStatus: (status) => set({ status }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
}));
