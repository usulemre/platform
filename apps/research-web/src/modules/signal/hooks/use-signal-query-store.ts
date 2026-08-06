import { create } from 'zustand';
import type { SignalStatusDto } from '../domain/dto';
import type { SignalSortField, SortDir } from '../domain/query';

/** Client-side UI state for the signal catalog controls (search/filter/sort).
 *  UI state only (Zustand); signal data is server state (TanStack Query). */
interface SignalQueryState {
  readonly search: string;
  readonly status: SignalStatusDto | 'ALL';
  readonly assetClass: string | 'ALL';
  readonly sortBy: SignalSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: SignalStatusDto | 'ALL') => void;
  readonly setAssetClass: (assetClass: string | 'ALL') => void;
  readonly setSort: (sortBy: SignalSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  assetClass: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useSignalQueryStore = create<SignalQueryState>((set) => ({
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
