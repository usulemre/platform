'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useUser } from '../hooks/use-user-management';
import {
  Chips,
  InfoCard,
  KeyValueList,
  StatusBadge,
  UmEmpty,
  UmError,
  UmLoading,
} from './um-atoms';

/** User details container. Orchestrates the detail query and lays out the
 *  profile, status, assignments (roles/groups/permissions), activity and session
 *  history panels. */
export function UserDetailView({ userId }: { userId: string }) {
  const { data, isLoading, isError, refetch } = useUser(userId);

  if (isLoading) return <UmLoading />;
  if (isError) return <UmError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <UmEmpty label="No user matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to users">
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.displayName}</h1>
        <StatusBadge label={data.status.label} tone={data.status.tone} />
        <StatusBadge label={data.accessLevel.label} tone={data.accessLevel.tone} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Profile">
          <KeyValueList rows={data.profile} />
        </InfoCard>

        <InfoCard title="Role assignment">
          <Chips items={data.roles} empty="No roles assigned." />
        </InfoCard>

        <InfoCard title="Group assignment">
          <Chips items={data.groups} empty="No group memberships." />
        </InfoCard>

        <InfoCard title="Effective permissions">
          <Chips items={data.permissions} empty="No permissions granted." />
        </InfoCard>

        <InfoCard title="Activity">
          {data.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {data.activity.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 border-b py-1"
                >
                  <span>
                    {event.action}{' '}
                    <span className="font-mono text-xs text-muted-foreground">{event.target}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {event.occurredLabel}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </InfoCard>

        <InfoCard title="Sessions">
          {data.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No session history.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Session history</caption>
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th scope="col" className="py-1 pr-4">
                      Device
                    </th>
                    <th scope="col" className="py-1 pr-4">
                      Started
                    </th>
                    <th scope="col" className="py-1 pr-4">
                      Last seen
                    </th>
                    <th scope="col" className="py-1">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0">
                      <th scope="row" className="py-1 pr-4 font-medium">
                        {session.device}
                      </th>
                      <td className="py-1 pr-4">{session.startedLabel}</td>
                      <td className="py-1 pr-4">{session.lastSeenLabel}</td>
                      <td className="py-1">
                        <StatusBadge label={session.status.label} tone={session.status.tone} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
