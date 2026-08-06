import { create } from 'zustand';
import type { EventCategoryDto, OutcomeDto } from '../domain/dto';
import type { AuditOrder } from '../domain/query';

/** Client-side UI state for the audit explorer controls (search / filter / order
 *  / pagination). UI state only (Zustand); audit data is server state. */
interface AuditQueryState {
  readonly search: string;
  readonly category: EventCategoryDto | 'ALL';
  readonly outcome: OutcomeDto | 'ALL';
  readonly order: AuditOrder;
  readonly page: number;
  readonly setSearch: (search: string) => void;
  readonly setCategory: (category: EventCategoryDto | 'ALL') => void;
  readonly setOutcome: (outcome: OutcomeDto | 'ALL') => void;
  readonly setOrder: (order: AuditOrder) => void;
  readonly setPage: (page: number) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  category: 'ALL' as const,
  outcome: 'ALL' as const,
  order: 'newest' as const,
  page: 1,
};

export const useAuditQueryStore = create<AuditQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search, page: 1 }),
  setCategory: (category) => set({ category, page: 1 }),
  setOutcome: (outcome) => set({ outcome, page: 1 }),
  setOrder: (order) => set({ order, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set({ ...INITIAL }),
}));
