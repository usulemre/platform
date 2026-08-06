import { create } from 'zustand';
import type { ExecutionModeDto, ExecutionStatusDto } from '../domain/dto';
import type { ExecutionSortField, SortDir } from '../domain/query';

/** Client-side UI state for the execution queue controls. UI state only
 *  (Zustand); execution data is server state (TanStack Query). */
interface ExecutionQueryState {
  readonly search: string;
  readonly status: ExecutionStatusDto | 'ALL';
  readonly mode: ExecutionModeDto | 'ALL';
  readonly sortBy: ExecutionSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: ExecutionStatusDto | 'ALL') => void;
  readonly setMode: (mode: ExecutionModeDto | 'ALL') => void;
  readonly setSort: (sortBy: ExecutionSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  mode: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useExecutionQueryStore = create<ExecutionQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setMode: (mode) => set({ mode }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
