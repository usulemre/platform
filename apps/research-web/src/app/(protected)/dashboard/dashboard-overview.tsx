'use client';

import { Alert, Card, CardContent, CardHeader, CardTitle, Spinner } from '@platform/ui';
import { usePermissions, useSession } from '@platform/auth/react';

/**
 * Renders the session summary with explicit loading and error states. The
 * permission list is advisory (UX only); the backend authorizes every action.
 */
export function DashboardOverview() {
  const session = useSession();
  const perms = usePermissions();

  if (session.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6">
          <Spinner />
          <span className="text-sm text-muted-foreground">Loading session…</span>
        </CardContent>
      </Card>
    );
  }

  if (session.isError || !session.snapshot) {
    return (
      <Alert variant="destructive" title="Session unavailable">
        Your session could not be loaded. Please sign in again.
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <div>Roles: {perms.roles.length > 0 ? perms.roles.join(', ') : '—'}</div>
        <div>Permissions: {perms.permissions.length > 0 ? perms.permissions.join(', ') : '—'}</div>
      </CardContent>
    </Card>
  );
}
