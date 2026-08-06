/**
 * User & Role Management view models — UI-facing, pre-formatted shapes produced
 * by the mappers so components carry no logic.
 */
import type { AppId } from './dto';

export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface PageInfoVm {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasPrev: boolean;
  readonly hasNext: boolean;
}

export interface UserListItemVm {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly status: StatusVm;
  readonly accessLevel: StatusVm;
  readonly team: string;
  readonly roleCount: number;
  readonly lastActiveLabel: string;
}

export interface UserPageVm {
  readonly items: readonly UserListItemVm[];
  readonly pageInfo: PageInfoVm;
}

export interface ActivityVm {
  readonly id: string;
  readonly action: string;
  readonly target: string;
  readonly occurredLabel: string;
}

export interface SessionVm {
  readonly id: string;
  readonly device: string;
  readonly startedLabel: string;
  readonly lastSeenLabel: string;
  readonly status: StatusVm;
}

export interface UserDetailVm {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly status: StatusVm;
  readonly accessLevel: StatusVm;
  readonly profile: readonly MetadataRowVm[];
  readonly roles: readonly string[];
  readonly groups: readonly string[];
  readonly permissions: readonly string[];
  readonly activity: readonly ActivityVm[];
  readonly sessions: readonly SessionVm[];
}

export interface GroupVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly roles: readonly string[];
  readonly memberCount: number;
}

export interface RoleListItemVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly permissionCount: number;
  readonly memberCount: number;
  readonly apps: readonly AppId[];
}

export interface MemberRefVm {
  readonly id: string;
  readonly displayName: string;
}

export interface RoleDetailVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly apps: readonly AppId[];
  readonly permissions: readonly string[];
  readonly members: readonly MemberRefVm[];
}

export interface PermissionVm {
  readonly id: string;
  readonly key: string;
  readonly description: string;
  readonly category: string;
}

export interface PermissionMatrixVm {
  readonly permissions: readonly string[];
  readonly rows: readonly {
    readonly roleId: string;
    readonly roleName: string;
    readonly cells: readonly boolean[];
  }[];
}

export interface PolicyVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly effect: string;
  readonly appliesTo: string;
}
