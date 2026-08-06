'use client';

import { useQuery } from '@tanstack/react-query';
import { userManagementService } from '../application/container';
import type { UserQuery } from '../domain/query';

/** Server-state hooks for the identity directory. They call the application
 *  service only — never a repository or transport directly. */
export function useUsers(query: UserQuery) {
  return useQuery({
    queryKey: ['um', 'users', query],
    queryFn: () => userManagementService.listUsers(query),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['um', 'user', id],
    queryFn: () => userManagementService.getUser(id),
    enabled: id.length > 0,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ['um', 'groups'],
    queryFn: () => userManagementService.listGroups(),
  });
}

export function useRoles() {
  return useQuery({ queryKey: ['um', 'roles'], queryFn: () => userManagementService.listRoles() });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ['um', 'role', id],
    queryFn: () => userManagementService.getRole(id),
    enabled: id.length > 0,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['um', 'permissions'],
    queryFn: () => userManagementService.listPermissions(),
  });
}

export function usePermissionMatrix() {
  return useQuery({
    queryKey: ['um', 'matrix'],
    queryFn: () => userManagementService.getPermissionMatrix(),
  });
}
