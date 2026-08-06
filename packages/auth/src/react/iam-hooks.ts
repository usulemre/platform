'use client';

/**
 * @platform/auth/react · iam-hooks — application-access, session-expiry and the
 * identity-directory query hooks. Directory hooks take an AccessControlService
 * instance (composed by the app), mirroring the `useLogin(client)` pattern.
 */
import { useQuery } from '@tanstack/react-query';
import { usePermissions, useSession } from './context';
import { canAccessApp } from '../iam/access';
import type { AppId } from '../iam/dto';
import { isExpired } from '../session';
import type { AccessControlService } from '../iam/service';

/** Whether the current identity may access an application (advisory UX). */
export function useAppAccess(app: AppId): boolean {
  const perms = usePermissions();
  return canAccessApp(perms.permissions, app);
}

/** Session-expiry view derived from the snapshot against the client clock. The
 *  backend session is authoritative; this is for UX display only. */
export function useSessionExpiry(): { expiresLabel?: string; isExpired: boolean } {
  const { snapshot } = useSession();
  if (!snapshot) return { isExpired: false };
  return {
    expiresLabel: snapshot.expiresAt.slice(0, 10),
    isExpired: isExpired(snapshot, new Date()),
  };
}

export function useRolesDirectory(service: AccessControlService) {
  return useQuery({ queryKey: ['iam', 'roles'], queryFn: () => service.listRoles() });
}

export function usePermissionsDirectory(service: AccessControlService) {
  return useQuery({ queryKey: ['iam', 'permissions'], queryFn: () => service.listPermissions() });
}

export function usePoliciesDirectory(service: AccessControlService) {
  return useQuery({ queryKey: ['iam', 'policies'], queryFn: () => service.listPolicies() });
}

export function useUsersDirectory(service: AccessControlService) {
  return useQuery({ queryKey: ['iam', 'users'], queryFn: () => service.listUsers() });
}
