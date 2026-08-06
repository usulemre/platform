/**
 * User & Role Management repository abstraction — the ONLY data boundary the
 * application service depends on. Concrete adapters implement it; the UI never
 * sees a concrete data source and never touches infrastructure.
 */
import type {
  GroupDto,
  Page,
  PermissionDto,
  PolicyDto,
  RoleDto,
  UserDetailDto,
  UserDto,
} from '../domain/dto';
import type { UserQuery } from '../domain/query';

export type { UserQuery };

export interface UserManagementRepository {
  listUsers(query: UserQuery): Promise<Page<UserDto>>;
  getUser(id: string): Promise<UserDetailDto | null>;
  listGroups(): Promise<readonly GroupDto[]>;
  listRoles(): Promise<readonly RoleDto[]>;
  getRole(id: string): Promise<RoleDto | null>;
  listPermissions(): Promise<readonly PermissionDto[]>;
  listPolicies(): Promise<readonly PolicyDto[]>;
}
