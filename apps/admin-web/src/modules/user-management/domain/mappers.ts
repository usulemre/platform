/**
 * DTO → view-model mappings + the permission-matrix builder. All presentation
 * decisions live here so UI components stay logic-free. Pure and deterministic.
 */
import type {
  AccessLevelDto,
  ActivityDto,
  GroupDto,
  MemberRefDto,
  Page,
  PermissionDto,
  PolicyDto,
  RoleDto,
  SessionDto,
  SessionStatusDto,
  UserDetailDto,
  UserDto,
  UserStatusDto,
} from './dto';
import type {
  ActivityVm,
  GroupVm,
  MetadataRowVm,
  PageInfoVm,
  PermissionMatrixVm,
  PermissionVm,
  PolicyVm,
  RoleDetailVm,
  RoleListItemVm,
  SessionVm,
  StatusVm,
  Tone,
  UserDetailVm,
  UserListItemVm,
  UserPageVm,
} from './view-model';

const STATUS_LABEL: Record<UserStatusDto, string> = {
  ACTIVE: 'Active',
  INVITED: 'Invited',
  SUSPENDED: 'Suspended',
  DISABLED: 'Disabled',
};

const STATUS_TONE: Record<UserStatusDto, Tone> = {
  ACTIVE: 'positive',
  INVITED: 'info',
  SUSPENDED: 'warning',
  DISABLED: 'danger',
};

const ACCESS_LABEL: Record<AccessLevelDto, string> = {
  STANDARD: 'Standard',
  ELEVATED: 'Elevated',
  ADMIN: 'Admin',
};

const ACCESS_TONE: Record<AccessLevelDto, Tone> = {
  STANDARD: 'neutral',
  ELEVATED: 'warning',
  ADMIN: 'danger',
};

const SESSION_LABEL: Record<SessionStatusDto, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

const SESSION_TONE: Record<SessionStatusDto, Tone> = {
  ACTIVE: 'positive',
  EXPIRED: 'neutral',
  REVOKED: 'danger',
};

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

function toStatusVm(status: UserStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toAccessVm(level: AccessLevelDto): StatusVm {
  return { value: level, label: ACCESS_LABEL[level], tone: ACCESS_TONE[level] };
}

function toActivityVm(activity: ActivityDto): ActivityVm {
  return {
    id: activity.id,
    action: activity.action,
    target: activity.target,
    occurredLabel: dateLabel(activity.occurredAt),
  };
}

function toSessionVm(session: SessionDto): SessionVm {
  return {
    id: session.id,
    device: session.device,
    startedLabel: dateLabel(session.startedAt),
    lastSeenLabel: dateLabel(session.lastSeenAt),
    status: {
      value: session.status,
      label: SESSION_LABEL[session.status],
      tone: SESSION_TONE[session.status],
    },
  };
}

export function toUserListItemVm(user: UserDto): UserListItemVm {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    status: toStatusVm(user.status),
    accessLevel: toAccessVm(user.accessLevel),
    team: user.team,
    roleCount: user.roles.length,
    lastActiveLabel: dateLabel(user.lastActiveAt),
  };
}

function pageInfo(page: Page<unknown>): PageInfoVm {
  const totalPages = Math.max(1, Math.ceil(page.total / page.pageSize));
  return {
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
    totalPages,
    hasPrev: page.page > 1,
    hasNext: page.page < totalPages,
  };
}

export function toUserPageVm(page: Page<UserDto>): UserPageVm {
  return { items: page.items.map(toUserListItemVm), pageInfo: pageInfo(page) };
}

export function toUserDetailVm(user: UserDetailDto): UserDetailVm {
  const profile: MetadataRowVm[] = [
    { label: 'Username', value: user.username },
    { label: 'Email', value: user.email },
    { label: 'Team', value: user.team },
    { label: 'Access level', value: ACCESS_LABEL[user.accessLevel] },
    { label: 'Created', value: dateLabel(user.createdAt) },
    { label: 'Last active', value: dateLabel(user.lastActiveAt) },
  ];
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    status: toStatusVm(user.status),
    accessLevel: toAccessVm(user.accessLevel),
    profile,
    roles: user.roles,
    groups: user.groups,
    permissions: user.permissions,
    activity: user.activity.map(toActivityVm),
    sessions: user.sessions.map(toSessionVm),
  };
}

export function toGroupVm(group: GroupDto): GroupVm {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    roles: group.roles,
    memberCount: group.memberIds.length,
  };
}

export function toRoleListItemVm(role: RoleDto): RoleListItemVm {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissionCount: role.permissions.length,
    memberCount: role.memberIds.length,
    apps: role.apps,
  };
}

export function toRoleDetailVm(role: RoleDto, members: readonly MemberRefDto[]): RoleDetailVm {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    apps: role.apps,
    permissions: role.permissions,
    members: members.map((member) => ({ id: member.id, displayName: member.displayName })),
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

/** Builds the role × permission matrix (rows = roles, columns = permissions). */
export function buildPermissionMatrix(
  roles: readonly RoleDto[],
  permissions: readonly PermissionDto[],
): PermissionMatrixVm {
  const columns = permissions.map((permission) => permission.key);
  return {
    permissions: columns,
    rows: roles.map((role) => ({
      roleId: role.id,
      roleName: role.name,
      cells: columns.map((key) => role.permissions.includes(key)),
    })),
  };
}
