'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { useAuditEvents } from '../hooks/use-audit';
import { useAuditQueryStore } from '../hooks/use-audit-query-store';
import type { EventCategoryDto, OutcomeDto } from '../domain/dto';
import type { AuditOrder, AuditQuery } from '../domain/query';
import { CATEGORY_ORDER, categoryLabel } from '../domain/mappers';
import {
  AuditEmpty,
  AuditError,
  AuditLoading,
  CategoryBadge,
  OutcomeBadge,
  Pagination,
} from './audit-atoms';

const OUTCOME_OPTIONS: readonly (OutcomeDto | 'ALL')[] = [
  'ALL',
  'SUCCESS',
  'INFO',
  'DENIED',
  'FAILURE',
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Audit explorer — search / filter / order / paginate over audit events. When a
 * `category` is provided (category-activity view), the category filter is locked
 * and hidden.
 */
export function AuditExplorer({ category: locked }: { category?: EventCategoryDto } = {}) {
  const search = useAuditQueryStore((state) => state.search);
  const storeCategory = useAuditQueryStore((state) => state.category);
  const outcome = useAuditQueryStore((state) => state.outcome);
  const order = useAuditQueryStore((state) => state.order);
  const page = useAuditQueryStore((state) => state.page);
  const setSearch = useAuditQueryStore((state) => state.setSearch);
  const setCategory = useAuditQueryStore((state) => state.setCategory);
  const setOutcome = useAuditQueryStore((state) => state.setOutcome);
  const setOrder = useAuditQueryStore((state) => state.setOrder);
  const setPage = useAuditQueryStore((state) => state.setPage);

  const category = locked ?? storeCategory;

  const query = useMemo<AuditQuery>(
    () => ({ search, category, outcome, order, page }),
    [search, category, outcome, order, page],
  );
  const { data, isLoading, isError, refetch } = useAuditEvents(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search audit events"
          placeholder="Search action, actor, target, IDs…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        {locked ? null : (
          <select
            aria-label="Filter by category"
            className={selectClass}
            value={storeCategory}
            onChange={(event) => setCategory(event.target.value as EventCategoryDto | 'ALL')}
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
          aria-label="Filter by outcome"
          className={selectClass}
          value={outcome}
          onChange={(event) => setOutcome(event.target.value as OutcomeDto | 'ALL')}
        >
          {OUTCOME_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All outcomes' : option}
            </option>
          ))}
        </select>
        <select
          aria-label="Order"
          className={selectClass}
          value={order}
          onChange={(event) => setOrder(event.target.value as AuditOrder)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {isLoading ? (
        <AuditLoading />
      ) : isError ? (
        <AuditError onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <AuditEmpty label="No audit events match your filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Audit events</caption>
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2">
                    When
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Actor
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Target
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((event) => (
                  <tr key={event.id} className="border-b last:border-0 hover:bg-accent/50">
                    <th scope="row" className="whitespace-nowrap px-4 py-2 font-medium">
                      <Link href={`/audit/${event.id}`} className="hover:underline">
                        {event.occurredLabel}
                      </Link>
                    </th>
                    <td className="px-4 py-2">
                      <CategoryBadge label={event.categoryLabel} />
                    </td>
                    <td className="px-4 py-2">{event.action}</td>
                    <td className="px-4 py-2">{event.actorLabel}</td>
                    <td className="px-4 py-2 font-mono text-xs">{event.targetLabel}</td>
                    <td className="px-4 py-2">
                      <OutcomeBadge label={event.outcome.label} tone={event.outcome.tone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

/** Category activity view = the explorer locked to one category. */
export function CategoryActivity({ category }: { category: EventCategoryDto }) {
  return <AuditExplorer category={category} />;
}
