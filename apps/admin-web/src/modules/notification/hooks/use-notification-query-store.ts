import { create } from 'zustand';
import type { NotificationCategoryDto, NotificationStatusDto, PriorityDto } from '../domain/dto';
import type { NotificationOrder } from '../domain/query';

/** Client-side UI state for the notification inbox controls (search / filter /
 *  order / pagination). UI state only (Zustand); notification data is server state. */
interface NotificationQueryState {
  readonly search: string;
  readonly category: NotificationCategoryDto | 'ALL';
  readonly priority: PriorityDto | 'ALL';
  readonly status: NotificationStatusDto | 'ALL';
  readonly order: NotificationOrder;
  readonly page: number;
  readonly setSearch: (search: string) => void;
  readonly setCategory: (category: NotificationCategoryDto | 'ALL') => void;
  readonly setPriority: (priority: PriorityDto | 'ALL') => void;
  readonly setStatus: (status: NotificationStatusDto | 'ALL') => void;
  readonly setOrder: (order: NotificationOrder) => void;
  readonly setPage: (page: number) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  category: 'ALL' as const,
  priority: 'ALL' as const,
  status: 'ALL' as const,
  order: 'newest' as const,
  page: 1,
};

export const useNotificationQueryStore = create<NotificationQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search, page: 1 }),
  setCategory: (category) => set({ category, page: 1 }),
  setPriority: (priority) => set({ priority, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setOrder: (order) => set({ order, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set({ ...INITIAL }),
}));
