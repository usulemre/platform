'use client';

import { Check } from 'lucide-react';
import { usePermissionMatrix } from '../hooks/use-user-management';
import { UmEmpty, UmError, UmLoading } from './um-atoms';

/** Permission matrix — roles (rows) × permissions (columns). Presentation only. */
export function PermissionMatrix() {
  const { data, isLoading, isError, refetch } = usePermissionMatrix();

  if (isLoading) return <UmLoading rows={6} />;
  if (isError) return <UmError onRetry={() => refetch()} />;
  if (!data || data.rows.length === 0)
    return <UmEmpty label="No roles or permissions to display." />;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Role and permission matrix</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Role
            </th>
            {data.permissions.map((permission) => (
              <th key={permission} scope="col" className="px-3 py-2 font-mono normal-case">
                {permission}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.roleId} className="border-b last:border-0">
              <th scope="row" className="px-4 py-2 font-medium">
                {row.roleName}
              </th>
              {row.cells.map((granted, index) => (
                <td key={data.permissions[index]} className="px-3 py-2 text-center">
                  {granted ? (
                    <Check className="mx-auto h-4 w-4 text-primary" aria-label="granted" />
                  ) : (
                    <span className="text-muted-foreground" aria-label="not granted">
                      –
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
