import { create } from 'zustand';
import type { ReportStage, SubjectKind } from '@platform/performance-sdk';
import type { ReportSortField, SortDir } from '../domain/query';

/** UI state for the performance reports list controls (Zustand; data is server state). */
interface ReportQueryState {
  readonly search: string;
  readonly namespace: string | 'ALL';
  readonly stage: ReportStage | 'ALL';
  readonly subjectKind: SubjectKind | 'ALL';
  readonly sortBy: ReportSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setNamespace: (namespace: string | 'ALL') => void;
  readonly setStage: (stage: ReportStage | 'ALL') => void;
  readonly setSubjectKind: (subjectKind: SubjectKind | 'ALL') => void;
  readonly setSort: (sortBy: ReportSortField) => void;
}

export const useReportQueryStore = create<ReportQueryState>((set) => ({
  search: '',
  namespace: 'ALL',
  stage: 'ALL',
  subjectKind: 'ALL',
  sortBy: 'name',
  sortDir: 'asc',
  setSearch: (search) => set({ search }),
  setNamespace: (namespace) => set({ namespace }),
  setStage: (stage) => set({ stage }),
  setSubjectKind: (subjectKind) => set({ subjectKind }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
}));
