/**
 * Canonical User & Role Management DTOs — the transport contract for the identity
 * directory (users, groups, roles, permissions, policies, sessions). Inert data
 * shapes only. Integrates with Authentication & Authorization by reusing the
 * shared `AppId` and the `Page<T>` envelope. No persistence, no external identity
 * providers, no secrets/PII beyond synthetic directory metadata.
 */
import type { AppId } from '@platform/auth';
import type { Page } from '@platform/types';

export type { AppId, Page };

export type UserStatusDto = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED';
export type AccessLevelDto = 'STANDARD' | 'ELEVATED' | 'ADMIN';
export type SessionStatusDto = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface ActivityDto {
  readonly id: string;
  readonly action: string;
  readonly target: string;
  readonly occurredAt: string;
}

export interface SessionDto {
  readonly id: string;
  readonly device: string;
  readonly startedAt: string;
  readonly lastSeenAt: string;
  readonly status: SessionStatusDto;
}

export interface UserDto {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly status: UserStatusDto;
  readonly accessLevel: AccessLevelDto;
  readonly team: string;
  readonly roles: readonly string[];
  readonly groups: readonly string[];
  readonly permissions: readonly string[];
  readonly lastActiveAt: string;
  readonly createdAt: string;
}

export interface UserDetailDto extends UserDto {
  readonly activity: readonly ActivityDto[];
  readonly sessions: readonly SessionDto[];
}

export interface GroupDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly roles: readonly string[];
  readonly memberIds: readonly string[];
}

export interface RoleDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly string[];
  readonly apps: readonly AppId[];
  readonly memberIds: readonly string[];
}

export interface PermissionDto {
  readonly id: string;
  readonly key: string;
  readonly description: string;
  readonly category: string;
}

export type PolicyEffectDto = 'ALLOW' | 'DENY';

export interface PolicyDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly effect: PolicyEffectDto;
  readonly appliesTo: string;
}

/** A resolved (id, displayName) member reference for role/group detail. */
export interface MemberRefDto {
  readonly id: string;
  readonly displayName: string;
}
