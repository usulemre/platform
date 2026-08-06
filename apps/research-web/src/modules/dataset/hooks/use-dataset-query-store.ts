import { create } from 'zustand';
import type { DatasetStatusDto } from '../domain/dto';
import type { DatasetSortField, SortDir } from '../domain/query';

/**
 * Client-side UI state for the dataset list controls (search / filter / sort).
 * UI state only (Zustand); dataset data itself is server state (TanStack Query).
 */
interface DatasetQueryState {
  readonly search: string;
  readonly status: DatasetStatusDto | 'ALL';
  readonly assetClass: string | 'ALL';
  readonly sortBy: DatasetSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: DatasetStatusDto | 'ALL') => void;
  readonly setAssetClass: (assetClass: string | 'ALL') => void;
  readonly setSort: (sortBy: DatasetSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  assetClass: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useDatasetQueryStore = create<DatasetQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setAssetClass: (assetClass) => set({ assetClass }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
