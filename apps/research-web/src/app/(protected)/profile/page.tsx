import type { Metadata } from 'next';
import { ApplicationGuard, PermissionGuard, UserProfile } from '@platform/auth/react';

export const metadata: Metadata = {
  title: 'Profile · Research Platform',
};

/** User Profile page (Server Component). Identity/roles/permissions are resolved
 *  from the session by the shared auth capability; the access examples use the
 *  reusable permission/application guards. */
export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Your profile</h1>
        <p className="max-w-prose text-muted-foreground">
          Identity, roles, permissions and application access resolved from your current session.
          Access checks below are advisory UX — the deterministic backend remains the authoritative
          gate.
        </p>
      </div>

      <UserProfile />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          Access examples (guards)
        </h2>
        <PermissionGuard
          permission="research:read"
          fallback={<p className="text-sm text-muted-foreground">You do not hold research:read.</p>}
        >
          <p className="text-sm">✓ You can read research artifacts (research:read).</p>
        </PermissionGuard>
        <ApplicationGuard
          app="admin-web"
          fallback={<p className="text-sm text-muted-foreground">You cannot access admin-web.</p>}
        >
          <p className="text-sm">✓ You can access the admin console (admin-web).</p>
        </ApplicationGuard>
      </section>
    </div>
  );
}
