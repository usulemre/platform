'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@platform/utils';
import { Input } from '@platform/ui';
import { useNotifications } from '../hooks/use-notifications';
import { useNotificationQueryStore } from '../hooks/use-notification-query-store';
import type { NotificationCategoryDto, NotificationStatusDto, PriorityDto } from '../domain/dto';
import type { NotificationOrder, NotificationQuery } from '../domain/query';
import { CATEGORY_ORDER, categoryLabel } from '../domain/mappers';
import {
  CategoryBadge,
  NotificationBadge,
  NotificationEmpty,
  NotificationError,
  NotificationLoading,
  Pagination,
} from './notification-atoms';

const PRIORITY_OPTIONS: readonly (PriorityDto | 'ALL')[] = [
  'ALL',
  'CRITICAL',
  'HIGH',
  'NORMAL',
  'LOW',
];
const STATUS_OPTIONS: readonly (NotificationStatusDto | 'ALL')[] = [
  'ALL',
  'UNREAD',
  'READ',
  'ARCHIVED',
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Notification inbox — search / filter / order / paginate. Optional `category`
 * and `status` locks power the category and Unread/History views.
 */
export function NotificationInbox({
  category: lockedCategory,
  status: lockedStatus,
}: {
  category?: NotificationCategoryDto;
  status?: NotificationStatusDto;
} = {}) {
  const search = useNotificationQueryStore((state) => state.search);
  const storeCategory = useNotificationQueryStore((state) => state.category);
  const priority = useNotificationQueryStore((state) => state.priority);
  const storeStatus = useNotificationQueryStore((state) => state.status);
  const order = useNotificationQueryStore((state) => state.order);
  const page = useNotificationQueryStore((state) => state.page);
  const setSearch = useNotificationQueryStore((state) => state.setSearch);
  const setCategory = useNotificationQueryStore((state) => state.setCategory);
  const setPriority = useNotificationQueryStore((state) => state.setPriority);
  const setStatus = useNotificationQueryStore((state) => state.setStatus);
  const setOrder = useNotificationQueryStore((state) => state.setOrder);
  const setPage = useNotificationQueryStore((state) => state.setPage);

  const category = lockedCategory ?? storeCategory;
  const status = lockedStatus ?? storeStatus;

  const query = useMemo<NotificationQuery>(
    () => ({ search, category, priority, status, order, page }),
    [search, category, priority, status, order, page],
  );
  const { data, isLoading, isError, refetch } = useNotifications(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          aria-label="Search notifications"
          placeholder="Search notifications…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        {lockedCategory ? null : (
          <select
            aria-label="Filter by category"
            className={selectClass}
            value={storeCategory}
            onChange={(event) => setCategory(event.target.value as NotificationCategoryDto | 'ALL')}
          >
            <option value="ALL">All categories</option>
            {CATEGORY_ORDER.map((option) => (
              <option key={option} value={option}>
                {categoryLabel(option)}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Filter by priority"
          className={selectClass}
          value={priority}
          onChange={(event) => setPriority(event.target.value as PriorityDto | 'ALL')}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All priorities' : option}
            </option>
          ))}
        </select>
        {lockedStatus ? null : (
          <select
            aria-label="Filter by status"
            className={selectClass}
            value={storeStatus}
            onChange={(event) => setStatus(event.target.value as NotificationStatusDto | 'ALL')}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All statuses' : option}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Order"
          className={selectClass}
          value={order}
          onChange={(event) => setOrder(event.target.value as NotificationOrder)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {isLoading ? (
        <NotificationLoading />
      ) : isError ? (
        <NotificationError onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <NotificationEmpty label="No notifications match your filters." />
      ) : (
        <>
          <ul className="divide-y rounded-lg border">
            {data.items.map((item) => (
              <li
                key={item.id}
                className={cn('flex items-start gap-3 p-3', item.isUnread && 'bg-accent/30')}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    item.isUnread ? 'bg-primary' : 'bg-transparent',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/notifications/${item.id}`}
                      className={cn(
                        'font-medium hover:underline',
                        item.isUnread && 'font-semibold',
                      )}
                    >
                      {item.title}
                    </Link>
                    <CategoryBadge label={item.categoryLabel} />
                    <NotificationBadge label={item.priority.label} tone={item.priority.tone} />
                    <NotificationBadge label={item.delivery.label} tone={item.delivery.tone} />
                    {item.isUnread ? <span className="sr-only">Unread</span> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.source} · {item.createdLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Pagination
            info={data.pageInfo}
            onPrev={() => setPage(Math.max(1, data.pageInfo.page - 1))}
            onNext={() => setPage(data.pageInfo.page + 1)}
          />
        </>
      )}
    </div>
  );
}

/** Category notifications = the inbox locked to one category. */
export function CategoryNotifications({ category }: { category: NotificationCategoryDto }) {
  return <NotificationInbox category={category} />;
}

/** Unread notifications = the inbox locked to UNREAD status. */
export function UnreadNotifications() {
  return <NotificationInbox status="UNREAD" />;
}
