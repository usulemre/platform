/**
 * @platform/auth · iam · service — the AccessControlService application layer.
 *
 * The ONLY layer the UI/hooks call for the identity directory. It orchestrates
 * the repository, maps DTOs to view models, and resolves access requirements
 * against a session (advisory). No infrastructure, no OAuth, no JWT, no
 * persistence. The backend authorization engine remains authoritative (CP-5).
 */
import type { SessionSnapshot } from '../model';
import { resolveAccess, type AccessResolution, type AccessRequirement } from './access';
import { toPermissionVm, toPolicyVm, toRoleVm, toUserProfileVm, toUserVm } from './mappers';
import type { IamRepository } from './repository';
import type { PermissionVm, PolicyVm, RoleVm, UserProfileVm, UserVm } from './view-model';

export class AccessControlService {
  constructor(private readonly repository: IamRepository) {}

  /** The authenticated caller's own profile (from the session snapshot). */
  resolveProfile(snapshot: SessionSnapshot | null): UserProfileVm | null {
    return snapshot ? toUserProfileVm(snapshot) : null;
  }

  /** Advisory access decision for a requirement against the session. */
  resolveAccess(
    snapshot: SessionSnapshot | null,
    requirement: AccessRequirement = {},
  ): AccessResolution {
    return resolveAccess(snapshot, requirement);
  }

  async listRoles(): Promise<RoleVm[]> {
    return (await this.repository.listRoles()).map(toRoleVm);
  }

  async listPermissions(): Promise<PermissionVm[]> {
    return (await this.repository.listPermissions()).map(toPermissionVm);
  }

  async listPolicies(): Promise<PolicyVm[]> {
    return (await this.repository.listPolicies()).map(toPolicyVm);
  }

  async listUsers(): Promise<UserVm[]> {
    return (await this.repository.listUsers()).map(toUserVm);
  }
}
