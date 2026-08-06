import { create } from 'zustand';
import type { ProjectStatus } from '@platform/research-sdk';
import type { ProjectSortField, SortDir } from '../domain/query';

/** UI state for the Research Registry list controls (Zustand; data is server state). */
interface ProjectQueryState {
  readonly search: string;
  readonly status: ProjectStatus | 'ALL';
  readonly sortBy: ProjectSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: ProjectStatus | 'ALL') => void;
  readonly setSort: (sortBy: ProjectSortField) => void;
}

export const useProjectQueryStore = create<ProjectQueryState>((set) => ({
  search: '',
  status: 'ALL',
  sortBy: 'updatedAt',
  sortDir: 'desc',
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
}));
