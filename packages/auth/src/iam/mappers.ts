/**
 * @platform/auth · iam · mappers — DTO/session → view-model mappings. Pure and
 * deterministic; the only presentation decisions are labels and date formatting.
 */
import type { SessionSnapshot } from '../model';
import { accessibleApps } from './access';
import type { PermissionDto, PolicyDto, RoleDto, UserDto } from './dto';
import type { PermissionVm, PolicyVm, RoleVm, UserProfileVm, UserVm } from './view-model';

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

const USER_STATUS_LABEL: Record<UserDto['status'], string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DISABLED: 'Disabled',
};

/** The authenticated caller's own profile, derived from the session snapshot. */
export function toUserProfileVm(snapshot: SessionSnapshot): UserProfileVm {
  return {
    displayName: snapshot.identity.displayName,
    username: snapshot.identity.principal.id,
    email: snapshot.identity.email,
    identityType: snapshot.identity.identityType,
    authority: snapshot.identity.authority,
    roles: snapshot.roles,
    permissions: snapshot.permissions,
    apps: accessibleApps(snapshot.permissions),
    sessionIssuedLabel: dateLabel(snapshot.issuedAt),
    sessionExpiresLabel: dateLabel(snapshot.expiresAt),
  };
}

export function toRoleVm(role: RoleDto): RoleVm {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissionCount: role.permissions.length,
    apps: role.apps,
  };
}

export function toPermissionVm(permission: PermissionDto): PermissionVm {
  return {
    id: permission.id,
    key: permission.key,
    description: permission.description,
    category: permission.category,
  };
}

export function toPolicyVm(policy: PolicyDto): PolicyVm {
  return {
    id: policy.id,
    name: policy.name,
    description: policy.description,
    effect: policy.effect,
    appliesTo: policy.appliesTo,
  };
}

export function toUserVm(user: UserDto): UserVm {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    statusLabel: USER_STATUS_LABEL[user.status],
    roles: user.roles,
  };
}
