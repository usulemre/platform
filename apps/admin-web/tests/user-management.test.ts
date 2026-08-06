import { describe, it, expect } from 'vitest';
import { applyUserQuery } from '../src/modules/user-management/domain/query';
import {
  buildPermissionMatrix,
  toUserDetailVm,
  toUserPageVm,
} from '../src/modules/user-management/domain/mappers';
import { UserManagementService } from '../src/modules/user-management/application/user-management-service';
import {
  MockUserManagementRepository,
  USER_MANAGEMENT_SEED,
} from '../src/modules/user-management/data/mock-repository';

const { users, roles, permissions } = USER_MANAGEMENT_SEED;

describe('applyUserQuery (pure filter/sort/paginate)', () => {
  it('paginates deterministically', () => {
    const p1 = applyUserQuery(users, { pageSize: 3, page: 1, sortBy: 'name', sortDir: 'asc' });
    expect(p1.items.length).toBe(3);
    expect(p1.total).toBe(users.length);
    expect(p1.page).toBe(1);
    const p2 = applyUserQuery(users, { pageSize: 3, page: 2, sortBy: 'name', sortDir: 'asc' });
    expect(p2.items[0]?.id).not.toBe(p1.items[0]?.id);
  });

  it('clamps an out-of-range page to the last page', () => {
    const page = applyUserQuery(users, { pageSize: 3, page: 99 });
    expect(page.page).toBe(Math.ceil(users.length / 3));
  });

  it('filters by status and role', () => {
    expect(
      applyUserQuery(users, { status: 'SUSPENDED' }).items.every((u) => u.status === 'SUSPENDED'),
    ).toBe(true);
    expect(
      applyUserQuery(users, { role: 'RESEARCHER' }).items.every((u) =>
        u.roles.includes('RESEARCHER'),
      ),
    ).toBe(true);
  });

  it('searches across name, username, email and team', () => {
    expect(applyUserQuery(users, { search: 'governance' }).total).toBeGreaterThan(0);
  });
});

describe('mappers + matrix', () => {
  it('maps a user page to view models with page info', () => {
    const vm = toUserPageVm(applyUserQuery(users, { pageSize: 3, page: 1 }));
    expect(vm.items.length).toBe(3);
    expect(vm.pageInfo.hasNext).toBe(true);
    expect(vm.pageInfo.totalPages).toBe(Math.ceil(users.length / 3));
  });

  it('builds a role × permission matrix with correct grants', () => {
    const matrix = buildPermissionMatrix(roles, permissions);
    expect(matrix.rows.length).toBe(roles.length);
    const researcher = matrix.rows.find((row) => row.roleName === 'RESEARCHER');
    const readIndex = matrix.permissions.indexOf('research:read');
    expect(researcher?.cells[readIndex]).toBe(true);
    const adminIndex = matrix.permissions.indexOf('agent:administer');
    expect(researcher?.cells[adminIndex]).toBe(false);
  });
});

describe('UserManagementService (application layer over mock repository)', () => {
  const service = new UserManagementService(new MockUserManagementRepository());

  it('lists users as a paginated view model', async () => {
    const page = await service.listUsers({ pageSize: 2, page: 1 });
    expect(page.items.length).toBe(2);
    expect(page.pageInfo.total).toBe(users.length);
  });

  it('returns user detail with activity and sessions, or null', async () => {
    const ada = await service.getUser('ada');
    expect(ada?.displayName).toBe('Ada Researcher');
    expect(ada?.sessions.length).toBeGreaterThan(0);
    expect(await service.getUser('nope')).toBeNull();
  });

  it('resolves role members and the permission matrix', async () => {
    const role = await service.getRole('r-researcher');
    expect(role?.members.some((m) => m.displayName === 'Ada Researcher')).toBe(true);
    const matrix = await service.getPermissionMatrix();
    expect(matrix.permissions.length).toBe(permissions.length);
  });
});

describe('user detail mapping', () => {
  it('derives status/access tones and profile rows', async () => {
    const service = new UserManagementService(new MockUserManagementRepository());
    const detail = await service.getUser('gia');
    expect(detail?.accessLevel.label).toBe('Admin');
    expect(detail?.status.tone).toBe('positive');
    // direct mapper check
    const raw = { ...users[2]!, activity: [], sessions: [] };
    expect(toUserDetailVm(raw).profile.some((row) => row.label === 'Access level')).toBe(true);
  });
});
