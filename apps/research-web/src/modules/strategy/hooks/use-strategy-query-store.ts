import { create } from 'zustand';
import type { StrategyStatusDto } from '../domain/dto';
import type { StrategySortField, SortDir } from '../domain/query';

/** Client-side UI state for the strategy catalog controls (search/filter/sort).
 *  UI state only (Zustand); strategy data is server state (TanStack Query). */
interface StrategyQueryState {
  readonly search: string;
  readonly status: StrategyStatusDto | 'ALL';
  readonly assetClass: string | 'ALL';
  readonly sortBy: StrategySortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: StrategyStatusDto | 'ALL') => void;
  readonly setAssetClass: (assetClass: string | 'ALL') => void;
  readonly setSort: (sortBy: StrategySortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  assetClass: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useStrategyQueryStore = create<StrategyQueryState>((set) => ({
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
