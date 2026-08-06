'use client';

/**
 * @platform/auth/react · guards — declarative access guards. Each renders its
 * children only when the requirement is met, otherwise a `fallback` (default:
 * nothing). Advisory UX only — the backend remains the authoritative gate (CP-5).
 * No authentication logic lives in consuming UI components; it lives here.
 */
import type { ReactNode } from 'react';
import { useCan, usePermissions, useSession } from './context';
import { canAccessApp } from '../iam/access';
import type { AppId } from '../iam/dto';

export interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders children only for an authenticated session. */
export function Authenticated({ children, fallback = null }: GuardProps) {
  const { isAuthenticated } = useSession();
  return <>{isAuthenticated ? children : fallback}</>;
}

/** Renders children only when the current identity holds a permission. */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: GuardProps & { permission: string }) {
  const allowed = useCan(permission);
  return <>{allowed ? children : fallback}</>;
}

/** Renders children only when the current identity holds any of the roles. */
export function RoleGuard({
  anyRole,
  children,
  fallback = null,
}: GuardProps & { anyRole: readonly string[] }) {
  const perms = usePermissions();
  const allowed = anyRole.some((role) => perms.hasRole(role));
  return <>{allowed ? children : fallback}</>;
}

/** Renders children only when the current identity may access an application. */
export function ApplicationGuard({ app, children, fallback = null }: GuardProps & { app: AppId }) {
  const perms = usePermissions();
  const allowed = canAccessApp(perms.permissions, app);
  return <>{allowed ? children : fallback}</>;
}
