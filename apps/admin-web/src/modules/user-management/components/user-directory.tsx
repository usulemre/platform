'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { useUsers } from '../hooks/use-user-management';
import { useUserQueryStore } from '../hooks/use-user-query-store';
import type { UserStatusDto } from '../domain/dto';
import type { UserQuery, UserSortField } from '../domain/query';
import { Pagination, StatusBadge, UmEmpty, UmError, UmLoading } from './um-atoms';

const STATUS_OPTIONS: readonly (UserStatusDto | 'ALL')[] = [
  'ALL',
  'ACTIVE',
  'INVITED',
  'SUSPENDED',
  'DISABLED',
];
const ROLE_OPTIONS: readonly string[] = [
  'ALL',
  'RESEARCHER',
  'AI_GOVERNANCE',
  'OPERATOR',
  'VIEWER',
];
const SORT_OPTIONS: readonly { value: UserSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'lastActive', label: 'Last active' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** User directory with search / filter / sort / pagination and the full state set. */
export function UserDirectory() {
  const search = useUserQueryStore((state) => state.search);
  const status = useUserQueryStore((state) => state.status);
  const role = useUserQueryStore((state) => state.role);
  const sortBy = useUserQueryStore((state) => state.sortBy);
  const sortDir = useUserQueryStore((state) => state.sortDir);
  const page = useUserQueryStore((state) => state.page);
  const setSearch = useUserQueryStore((state) => state.setSearch);
  const setStatus = useUserQueryStore((state) => state.setStatus);
  const setRole = useUserQueryStore((state) => state.setRole);
  const setSort = useUserQueryStore((state) => state.setSort);
  const setPage = useUserQueryStore((state) => state.setPage);

  const query = useMemo<UserQuery>(
    () => ({ search, status, role, sortBy, sortDir, page }),
    [search, status, role, sortBy, sortDir, page],
  );
  const { data, isLoading, isError, refetch } = useUsers(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search users"
          placeholder="Search users…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as UserStatusDto | 'ALL')}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All statuses' : option}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by role"
          className={selectClass}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All roles' : option}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          className={selectClass}
          value={sortBy}
          onChange={(event) => setSort(event.target.value as UserSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <UmLoading />
      ) : isError ? (
        <UmError onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <UmEmpty label="No users match your filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">User directory</caption>
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2">
                    User
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Team
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Access
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Roles
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Last active
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-accent/50">
                    <th scope="row" className="px-4 py-2 font-medium">
                      <Link href={`/users/${user.id}`} className="hover:underline">
                        {user.displayName}
                      </Link>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </th>
                    <td className="px-4 py-2">{user.team}</td>
                    <td className="px-4 py-2">
                      <StatusBadge label={user.accessLevel.label} tone={user.accessLevel.tone} />
                    </td>
                    <td className="px-4 py-2">{user.roleCount}</td>
                    <td className="px-4 py-2">{user.lastActiveLabel}</td>
                    <td className="px-4 py-2">
                      <StatusBadge label={user.status.label} tone={user.status.tone} />
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
