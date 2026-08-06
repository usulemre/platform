import { create } from 'zustand';
import type { MonitorLevel } from '../domain/dto';
import type { ServiceSortField, SortDir } from '../domain/query';

/** Client-side UI state for the Service Health list controls. UI state only
 *  (Zustand); operational data is server state (TanStack Query). */
interface ServiceQueryState {
  readonly search: string;
  readonly level: MonitorLevel | 'ALL';
  readonly sortBy: ServiceSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setLevel: (level: MonitorLevel | 'ALL') => void;
  readonly setSort: (sortBy: ServiceSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  level: 'ALL' as const,
  sortBy: 'level' as const,
  sortDir: 'desc' as const,
};

export const useServiceQueryStore = create<ServiceQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setLevel: (level) => set({ level }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
