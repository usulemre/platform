/**
 * @platform/auth · iam — identity & access-management SHAPES (User / Role /
 * Permission / Policy registries). Inert type declarations only, mirroring the
 * governed backend registries. No OAuth, no JWT, no persistence, no secrets.
 */
import type { Id, Iso8601 } from '../model';

/** The canonical applications a principal may be granted access to. */
export type AppId = 'research-web' | 'admin-web' | 'monitoring-web';

export type UserStatusDto = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

export interface UserDto {
  readonly id: Id;
  readonly username: string;
  readonly displayName: string;
  readonly email?: string;
  readonly status: UserStatusDto;
  readonly team?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly createdAt: Iso8601;
}

export interface RoleDto {
  readonly id: Id;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly string[];
  /** Applications this role grants access to. */
  readonly apps: readonly AppId[];
}

export interface PermissionDto {
  readonly id: Id;
  readonly key: string;
  readonly description: string;
  readonly category: string;
}

export type PolicyEffectDto = 'ALLOW' | 'DENY';

export interface PolicyDto {
  readonly id: Id;
  readonly name: string;
  readonly description: string;
  readonly effect: PolicyEffectDto;
  readonly appliesTo: string;
}
