import type { Metadata } from 'next';
import { PermissionMatrix } from '@/modules/user-management';

export const metadata: Metadata = {
  title: 'Permission matrix · Admin',
};

/** Permission Matrix page (Server Component). */
export default function PermissionsPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Permission matrix</h1>
        <p className="max-w-prose text-muted-foreground">
          Roles × permissions. Read-only presentation of the governed access model.
        </p>
      </div>
      <PermissionMatrix />
    </div>
  );
}
