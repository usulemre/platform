/**
 * Real adapter over the governed API gateway (identity services). NOT wired in
 * v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never an external identity provider, never persistence here.
 */
import type { ApiClient } from '@platform/api-client';
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
import type { UserManagementRepository } from './repository';

function buildQueryString(query: UserQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.role && query.role !== 'ALL') params.set('role', query.role);
  if (query.group && query.group !== 'ALL') params.set('group', query.group);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiUserManagementRepository implements UserManagementRepository {
  constructor(private readonly api: ApiClient) {}

  listUsers(query: UserQuery): Promise<Page<UserDto>> {
    return this.api.request<Page<UserDto>>(`/users${buildQueryString(query)}`);
  }

  async getUser(id: string): Promise<UserDetailDto | null> {
    try {
      return await this.api.request<UserDetailDto>(`/users/${id}`);
    } catch {
      return null;
    }
  }

  listGroups(): Promise<readonly GroupDto[]> {
    return this.api.request<readonly GroupDto[]>('/groups');
  }

  listRoles(): Promise<readonly RoleDto[]> {
    return this.api.request<readonly RoleDto[]>('/roles');
  }

  async getRole(id: string): Promise<RoleDto | null> {
    try {
      return await this.api.request<RoleDto>(`/roles/${id}`);
    } catch {
      return null;
    }
  }

  listPermissions(): Promise<readonly PermissionDto[]> {
    return this.api.request<readonly PermissionDto[]>('/permissions');
  }

  listPolicies(): Promise<readonly PolicyDto[]> {
    return this.api.request<readonly PolicyDto[]>('/policies');
  }
}
