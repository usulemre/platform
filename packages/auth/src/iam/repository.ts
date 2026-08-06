/**
 * @platform/auth · iam · repository — the identity-directory data boundary
 * (User / Role / Permission / Policy registries). The application service depends
 * only on this abstraction; the UI never sees a concrete data source and never
 * touches infrastructure.
 */
import type { PermissionDto, PolicyDto, RoleDto, UserDto } from './dto';

export interface IamRepository {
  listUsers(): Promise<readonly UserDto[]>;
  getUser(id: string): Promise<UserDto | null>;
  listRoles(): Promise<readonly RoleDto[]>;
  listPermissions(): Promise<readonly PermissionDto[]>;
  listPolicies(): Promise<readonly PolicyDto[]>;
}
