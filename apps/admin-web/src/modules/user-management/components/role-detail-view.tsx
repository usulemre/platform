'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useRole } from '../hooks/use-user-management';
import { Chips, InfoCard, StatusBadge, UmEmpty, UmError, UmLoading } from './um-atoms';

/** Role details container. Shows the role's apps, permissions and assigned
 *  members (User Assignment for the role). */
export function RoleDetailView({ roleId }: { roleId: string }) {
  const { data, isLoading, isError, refetch } = useRole(roleId);

  if (isLoading) return <UmLoading />;
  if (isError) return <UmError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/roles">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <UmEmpty label="No role matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to roles">
          <Link href="/roles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        {data.apps.map((app) => (
          <StatusBadge key={app} label={app} tone="info" />
        ))}
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Permissions">
          <Chips items={data.permissions} empty="No permissions." />
        </InfoCard>
        <InfoCard title="Members (assignments)">
          {data.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members assigned.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.members.map((member) => (
                <li key={member.id} className="border-b py-1">
                  <Link href={`/users/${member.id}`} className="font-medium hover:underline">
                    {member.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
