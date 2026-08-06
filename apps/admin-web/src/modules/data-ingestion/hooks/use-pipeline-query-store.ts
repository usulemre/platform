import { create } from 'zustand';
import type { DataType, PipelineStatus } from '@platform/data-sdk';
import type { PipelineSortField, SortDir } from '../domain/query';

/** Client-side UI state for the Pipeline Registry list controls. UI state only
 *  (Zustand); pipeline data is server state (TanStack Query). */
interface PipelineQueryState {
  readonly search: string;
  readonly dataType: DataType | 'ALL';
  readonly status: PipelineStatus | 'ALL';
  readonly sortBy: PipelineSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setDataType: (dataType: DataType | 'ALL') => void;
  readonly setStatus: (status: PipelineStatus | 'ALL') => void;
  readonly setSort: (sortBy: PipelineSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  dataType: 'ALL' as const,
  status: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const usePipelineQueryStore = create<PipelineQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setDataType: (dataType) => set({ dataType }),
  setStatus: (status) => set({ status }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
