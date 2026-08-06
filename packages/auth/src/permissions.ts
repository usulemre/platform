/**
 * @platform/auth · permissions — pure, advisory permission predicates.
 *
 * IMPORTANT (CLAUDE.md CP-5, separation of powers): these client-side checks
 * are for UX gating ONLY — hiding a control the user cannot use. They are NOT a
 * security boundary. The deterministic backend Authorization Foundation is the
 * sole authoritative gate; every action is re-authorized server-side.
 */
import type { SessionSnapshot } from './model';

export function can(snapshot: SessionSnapshot | null, permission: string): boolean {
  if (!snapshot) return false;
  return snapshot.permissions.includes(permission);
}

export function canAll(snapshot: SessionSnapshot | null, permissions: readonly string[]): boolean {
  return permissions.every((permission) => can(snapshot, permission));
}

export function canAny(snapshot: SessionSnapshot | null, permissions: readonly string[]): boolean {
  return permissions.some((permission) => can(snapshot, permission));
}

export function hasRole(snapshot: SessionSnapshot | null, role: string): boolean {
  if (!snapshot) return false;
  return snapshot.roles.includes(role);
}
