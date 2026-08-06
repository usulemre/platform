import { create } from 'zustand';
import type { UserStatusDto } from '../domain/dto';
import type { UserSortField, SortDir } from '../domain/query';

/** Client-side UI state for the user directory controls (search / filter / sort
 *  / pagination). UI state only (Zustand); directory data is server state. */
interface UserQueryState {
  readonly search: string;
  readonly status: UserStatusDto | 'ALL';
  readonly role: string | 'ALL';
  readonly sortBy: UserSortField;
  readonly sortDir: SortDir;
  readonly page: number;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: UserStatusDto | 'ALL') => void;
  readonly setRole: (role: string | 'ALL') => void;
  readonly setSort: (sortBy: UserSortField) => void;
  readonly setPage: (page: number) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  role: 'ALL' as const,
  sortBy: 'name' as const,
  sortDir: 'asc' as const,
  page: 1,
};

export const useUserQueryStore = create<UserQueryState>((set) => ({
  ...INITIAL,
  // Filter/search/sort changes reset to page 1 so pagination stays consistent.
  setSearch: (search) => set({ search, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setRole: (role) => set({ role, page: 1 }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc', page: 1 }
        : { sortBy, sortDir: 'asc', page: 1 },
    ),
  setPage: (page) => set({ page }),
  reset: () => set({ ...INITIAL }),
}));
