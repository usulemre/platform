/**
 * @platform/auth · iam · view-model — UI-facing IAM shapes.
 */
import type { AppId } from './dto';

export interface UserProfileVm {
  readonly displayName: string;
  readonly username: string;
  readonly email?: string;
  readonly identityType: string;
  readonly authority: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly apps: readonly AppId[];
  readonly sessionIssuedLabel: string;
  readonly sessionExpiresLabel: string;
}

export interface RoleVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly permissionCount: number;
  readonly apps: readonly AppId[];
}

export interface PermissionVm {
  readonly id: string;
  readonly key: string;
  readonly description: string;
  readonly category: string;
}

export interface PolicyVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly effect: string;
  readonly appliesTo: string;
}

export interface UserVm {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email?: string;
  readonly statusLabel: string;
  readonly roles: readonly string[];
}
