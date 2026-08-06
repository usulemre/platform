'use client';

import Link from 'next/link';
import { useRoles } from '../hooks/use-user-management';
import { StatusBadge, UmEmpty, UmError, UmLoading } from './um-atoms';

/** Role directory (list of roles with permission/member counts). */
export function RoleDirectory() {
  const { data, isLoading, isError, refetch } = useRoles();

  if (isLoading) return <UmLoading />;
  if (isError) return <UmError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <UmEmpty label="No roles defined." />;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Role directory</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Role
            </th>
            <th scope="col" className="px-4 py-2">
              Description
            </th>
            <th scope="col" className="px-4 py-2">
              Apps
            </th>
            <th scope="col" className="px-4 py-2">
              Permissions
            </th>
            <th scope="col" className="px-4 py-2">
              Members
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((role) => (
            <tr key={role.id} className="border-b last:border-0 hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-medium">
                <Link href={`/roles/${role.id}`} className="hover:underline">
                  {role.name}
                </Link>
              </th>
              <td className="px-4 py-2 text-muted-foreground">{role.description}</td>
              <td className="px-4 py-2">
                <span className="flex flex-wrap gap-1">
                  {role.apps.map((app) => (
                    <StatusBadge key={app} label={app} tone="info" />
                  ))}
                </span>
              </td>
              <td className="px-4 py-2">{role.permissionCount}</td>
              <td className="px-4 py-2">{role.memberCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
