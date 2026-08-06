import { create } from 'zustand';
import type { FeatureStatusDto } from '../domain/dto';
import type { FeatureSortField, SortDir } from '../domain/query';

/** Client-side UI state for the feature catalog controls (search/filter/sort).
 *  UI state only (Zustand); feature data is server state (TanStack Query). */
interface FeatureQueryState {
  readonly search: string;
  readonly status: FeatureStatusDto | 'ALL';
  readonly category: string | 'ALL';
  readonly sortBy: FeatureSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: FeatureStatusDto | 'ALL') => void;
  readonly setCategory: (category: string | 'ALL') => void;
  readonly setSort: (sortBy: FeatureSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  category: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useFeatureQueryStore = create<FeatureQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setCategory: (category) => set({ category }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
