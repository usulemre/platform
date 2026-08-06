import { create } from 'zustand';
import type { PortfolioStatusDto } from '../domain/dto';
import type { PortfolioSortField, SortDir } from '../domain/query';

/** Client-side UI state for the portfolio catalog controls (search/filter/sort).
 *  UI state only (Zustand); portfolio data is server state (TanStack Query). */
interface PortfolioQueryState {
  readonly search: string;
  readonly status: PortfolioStatusDto | 'ALL';
  readonly assetClass: string | 'ALL';
  readonly sortBy: PortfolioSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: PortfolioStatusDto | 'ALL') => void;
  readonly setAssetClass: (assetClass: string | 'ALL') => void;
  readonly setSort: (sortBy: PortfolioSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  assetClass: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const usePortfolioQueryStore = create<PortfolioQueryState>((set) => ({
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
