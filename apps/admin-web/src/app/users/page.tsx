import type { Metadata } from 'next';
import { UserDirectory } from '@/modules/user-management';

export const metadata: Metadata = {
  title: 'Users · Admin',
};

/** User Directory page (Server Component). The interactive directory is a Client
 *  Component that fetches through the application service. */
export default function UsersPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="max-w-prose text-muted-foreground">
          The identity directory. Read-only — assignments and access elevation are governed and
          counter-signed at the backend (HO-2); this console presents, it does not mutate.
        </p>
      </div>
      <UserDirectory />
    </div>
  );
}
