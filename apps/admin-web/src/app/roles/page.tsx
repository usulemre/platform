import type { Metadata } from 'next';
import { RoleDirectory } from '@/modules/user-management';

export const metadata: Metadata = {
  title: 'Roles · Admin',
};

/** Role Directory page (Server Component). */
export default function RolesPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Roles</h1>
        <p className="max-w-prose text-muted-foreground">
          Roles group permissions and application access. Read-only presentation.
        </p>
      </div>
      <RoleDirectory />
    </div>
  );
}
