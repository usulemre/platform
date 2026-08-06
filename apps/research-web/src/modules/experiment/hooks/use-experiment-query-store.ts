import { create } from 'zustand';
import type { ExperimentOutcomeDto, ExperimentStatusDto } from '../domain/dto';
import type { ExperimentSortField, SortDir } from '../domain/query';

/** Client-side UI state for the experiment list controls (search/filter/sort).
 *  UI state only (Zustand); experiment data is server state (TanStack Query). */
interface ExperimentQueryState {
  readonly search: string;
  readonly status: ExperimentStatusDto | 'ALL';
  readonly outcome: ExperimentOutcomeDto | 'ALL';
  readonly sortBy: ExperimentSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: ExperimentStatusDto | 'ALL') => void;
  readonly setOutcome: (outcome: ExperimentOutcomeDto | 'ALL') => void;
  readonly setSort: (sortBy: ExperimentSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  outcome: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useExperimentQueryStore = create<ExperimentQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setOutcome: (outcome) => set({ outcome }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
