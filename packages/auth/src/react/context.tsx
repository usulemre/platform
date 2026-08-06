'use client';

/**
 * @platform/auth/react · context — the Identity & Permission contexts.
 *
 * A single `AuthProvider` owns the session as SERVER state (TanStack Query over
 * the governed `/auth/session` endpoint). The Identity context and Permission
 * context are DERIVED from that single source (no duplicate fetching), exposed
 * as focused hooks: `useSession`, `useIdentity`, `usePermissions`, `useCan`.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AuthClient } from '../client';
import type { Identity, SessionSnapshot } from '../model';
import { can, canAll, canAny, hasRole } from '../permissions';

export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export interface SessionContextValue {
  readonly snapshot: SessionSnapshot | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly query: UseQueryResult<SessionSnapshot>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export interface AuthProviderProps {
  readonly client: AuthClient;
  readonly children: ReactNode;
}

export function AuthProvider({ client, children }: AuthProviderProps) {
  const query = useQuery<SessionSnapshot>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => client.session(),
    retry: false,
    staleTime: 30_000,
  });

  const value = useMemo<SessionContextValue>(
    () => ({
      snapshot: query.data ?? null,
      isAuthenticated: query.isSuccess && query.data != null,
      isLoading: query.isLoading,
      isError: query.isError,
      query,
    }),
    [query],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession/useIdentity/usePermissions must be used within <AuthProvider>.');
  }
  return ctx;
}

/** Session context: status + the raw query for advanced consumers. */
export function useSession(): SessionContextValue {
  return useSessionContext();
}

/** Identity context: the current backend-asserted identity, or null. */
export function useIdentity(): Identity | null {
  return useSessionContext().snapshot?.identity ?? null;
}

export interface PermissionApi {
  readonly can: (permission: string) => boolean;
  readonly canAll: (permissions: readonly string[]) => boolean;
  readonly canAny: (permissions: readonly string[]) => boolean;
  readonly hasRole: (role: string) => boolean;
  readonly permissions: readonly string[];
  readonly roles: readonly string[];
}

/** Permission context: advisory UX checks derived from the session snapshot. */
export function usePermissions(): PermissionApi {
  const { snapshot } = useSessionContext();
  return useMemo<PermissionApi>(
    () => ({
      can: (permission) => can(snapshot, permission),
      canAll: (permissions) => canAll(snapshot, permissions),
      canAny: (permissions) => canAny(snapshot, permissions),
      hasRole: (role) => hasRole(snapshot, role),
      permissions: snapshot?.permissions ?? [],
      roles: snapshot?.roles ?? [],
    }),
    [snapshot],
  );
}

/** Convenience: advisory check for a single permission. */
export function useCan(permission: string): boolean {
  return can(useSessionContext().snapshot, permission);
}
