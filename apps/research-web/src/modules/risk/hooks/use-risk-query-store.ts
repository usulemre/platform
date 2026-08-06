import { create } from 'zustand';
import type { RiskAssessmentStatusDto, SubjectKindDto } from '../domain/dto';
import type { RiskSortField, SortDir } from '../domain/query';

/** Client-side UI state for the risk assessment list controls. UI state only
 *  (Zustand); assessment data is server state (TanStack Query). */
interface RiskQueryState {
  readonly search: string;
  readonly status: RiskAssessmentStatusDto | 'ALL';
  readonly subjectKind: SubjectKindDto | 'ALL';
  readonly sortBy: RiskSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: RiskAssessmentStatusDto | 'ALL') => void;
  readonly setSubjectKind: (subjectKind: SubjectKindDto | 'ALL') => void;
  readonly setSort: (sortBy: RiskSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  subjectKind: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useRiskQueryStore = create<RiskQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setSubjectKind: (subjectKind) => set({ subjectKind }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
