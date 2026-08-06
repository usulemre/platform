/**
 * @platform/auth · iam · access — pure access-control resolution.
 *
 * Framework-independent, deterministic predicates for application access and
 * role resolution. IMPORTANT (CLAUDE.md CP-5): these are advisory UX checks; the
 * deterministic backend authorization engine is the authoritative gate.
 */
import type { SessionSnapshot } from '../model';
import type { AppId } from './dto';

export const APP_IDS: readonly AppId[] = ['research-web', 'admin-web', 'monitoring-web'];

/** Each application is gated by an application-access permission. */
export const APP_ACCESS_PERMISSION: Record<AppId, string> = {
  'research-web': 'app:research',
  'admin-web': 'app:admin',
  'monitoring-web': 'app:monitoring',
};

export function canAccessApp(permissions: readonly string[], appId: AppId): boolean {
  return permissions.includes(APP_ACCESS_PERMISSION[appId]);
}

export function accessibleApps(permissions: readonly string[]): AppId[] {
  return APP_IDS.filter((appId) => canAccessApp(permissions, appId));
}

export function hasAnyRole(roles: readonly string[], candidates: readonly string[]): boolean {
  return candidates.some((candidate) => roles.includes(candidate));
}

export function hasAllRoles(roles: readonly string[], required: readonly string[]): boolean {
  return required.every((role) => roles.includes(role));
}

export interface AccessRequirement {
  readonly permission?: string;
  readonly anyRole?: readonly string[];
  readonly app?: AppId;
}

/** Distinct from the route guard's `AccessDecisionKind`; this is for IAM access. */
export type AccessResolutionKind = 'ALLOW' | 'FORBIDDEN' | 'UNAUTHENTICATED';

export interface AccessResolution {
  readonly kind: AccessResolutionKind;
  readonly reason: string;
}

/**
 * Resolve an access requirement against a session snapshot (advisory). Returns
 * UNAUTHENTICATED when there is no session, FORBIDDEN when a requirement is not
 * met, otherwise ALLOW.
 */
export function resolveAccess(
  snapshot: SessionSnapshot | null,
  requirement: AccessRequirement = {},
): AccessResolution {
  if (!snapshot) {
    return { kind: 'UNAUTHENTICATED', reason: 'no-session' };
  }
  if (requirement.permission && !snapshot.permissions.includes(requirement.permission)) {
    return { kind: 'FORBIDDEN', reason: 'missing-permission' };
  }
  if (
    requirement.anyRole &&
    requirement.anyRole.length > 0 &&
    !hasAnyRole(snapshot.roles, requirement.anyRole)
  ) {
    return { kind: 'FORBIDDEN', reason: 'missing-role' };
  }
  if (requirement.app && !canAccessApp(snapshot.permissions, requirement.app)) {
    return { kind: 'FORBIDDEN', reason: 'no-app-access' };
  }
  return { kind: 'ALLOW', reason: 'authorized' };
}
