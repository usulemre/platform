/**
 * User & Role Management application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository, maps DTOs to view models, resolves role members
 * and builds the permission matrix. No infrastructure, no UI, no persistence, no
 * external identity provider. Directory MUTATIONS (assignments, elevation) are
 * governed and NOT performed here; v1 is read-only presentation.
 */
import {
  buildPermissionMatrix,
  toGroupVm,
  toPermissionVm,
  toPolicyVm,
  toRoleDetailVm,
  toRoleListItemVm,
  toUserDetailVm,
  toUserPageVm,
} from '../domain/mappers';
import type { MemberRefDto } from '../domain/dto';
import type { UserQuery } from '../domain/query';
import type {
  GroupVm,
  PermissionMatrixVm,
  PermissionVm,
  PolicyVm,
  RoleDetailVm,
  RoleListItemVm,
  UserDetailVm,
  UserPageVm,
} from '../domain/view-model';
import type { UserManagementRepository } from '../data/repository';

export class UserManagementService {
  constructor(private readonly repository: UserManagementRepository) {}

  async listUsers(query: UserQuery = {}): Promise<UserPageVm> {
    return toUserPageVm(await this.repository.listUsers(query));
  }

  async getUser(id: string): Promise<UserDetailVm | null> {
    const user = await this.repository.getUser(id);
    return user ? toUserDetailVm(user) : null;
  }

  async listGroups(): Promise<GroupVm[]> {
    return (await this.repository.listGroups()).map(toGroupVm);
  }

  async listRoles(): Promise<RoleListItemVm[]> {
    return (await this.repository.listRoles()).map(toRoleListItemVm);
  }

  async getRole(id: string): Promise<RoleDetailVm | null> {
    const role = await this.repository.getRole(id);
    if (!role) return null;
    const usersPage = await this.repository.listUsers({ pageSize: 1000 });
    const byId = new Map(usersPage.items.map((user) => [user.id, user.displayName] as const));
    const members: MemberRefDto[] = role.memberIds.map((id) => ({
      id,
      displayName: byId.get(id) ?? id,
    }));
    return toRoleDetailVm(role, members);
  }

  async listPermissions(): Promise<PermissionVm[]> {
    return (await this.repository.listPermissions()).map(toPermissionVm);
  }

  async listPolicies(): Promise<PolicyVm[]> {
    return (await this.repository.listPolicies()).map(toPolicyVm);
  }

  async getPermissionMatrix(): Promise<PermissionMatrixVm> {
    const [roles, permissions] = await Promise.all([
      this.repository.listRoles(),
      this.repository.listPermissions(),
    ]);
    return buildPermissionMatrix(roles, permissions);
  }
}
