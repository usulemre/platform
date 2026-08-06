/**
 * In-memory mock adapter for development. Synthetic directory METADATA ONLY — no
 * persistence, no external identity providers, no credentials/PII beyond example
 * fields. Roles/permissions align with the shared auth IAM vocabulary.
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
import { applyUserQuery, type UserQuery } from '../domain/query';
import type { UserManagementRepository } from './repository';

const PERMISSIONS: readonly PermissionDto[] = [
  {
    id: 'p-app-research',
    key: 'app:research',
    description: 'Access research web',
    category: 'application',
  },
  { id: 'p-app-admin', key: 'app:admin', description: 'Access admin web', category: 'application' },
  {
    id: 'p-app-monitoring',
    key: 'app:monitoring',
    description: 'Access monitoring web',
    category: 'application',
  },
  {
    id: 'p-research-read',
    key: 'research:read',
    description: 'Read research artifacts',
    category: 'research',
  },
  {
    id: 'p-research-propose',
    key: 'research:propose',
    description: 'Propose research artifacts',
    category: 'research',
  },
  {
    id: 'p-agent-administer',
    key: 'agent:administer',
    description: 'Administer AI agents',
    category: 'governance',
  },
  {
    id: 'p-monitoring-read',
    key: 'monitoring:read',
    description: 'Read monitoring',
    category: 'operations',
  },
];

const ROLES: readonly RoleDto[] = [
  {
    id: 'r-researcher',
    name: 'RESEARCHER',
    description: 'Reads and proposes research artifacts.',
    permissions: ['app:research', 'research:read', 'research:propose'],
    apps: ['research-web'],
    memberIds: ['ada', 'ben'],
  },
  {
    id: 'r-governance',
    name: 'AI_GOVERNANCE',
    description: 'Administers AI agents and governance.',
    permissions: ['app:admin', 'agent:administer'],
    apps: ['admin-web'],
    memberIds: ['gia'],
  },
  {
    id: 'r-operator',
    name: 'OPERATOR',
    description: 'Monitors production operations.',
    permissions: ['app:monitoring', 'monitoring:read'],
    apps: ['monitoring-web'],
    memberIds: ['ops'],
  },
  {
    id: 'r-viewer',
    name: 'VIEWER',
    description: 'Read-only research access.',
    permissions: ['app:research', 'research:read'],
    apps: ['research-web'],
    memberIds: ['viv'],
  },
];

const GROUPS: readonly GroupDto[] = [
  {
    id: 'g-quant',
    name: 'Quant Research',
    description: 'Quantitative research team.',
    roles: ['RESEARCHER'],
    memberIds: ['ada', 'ben'],
  },
  {
    id: 'g-governance',
    name: 'AI Governance',
    description: 'AI governance committee.',
    roles: ['AI_GOVERNANCE'],
    memberIds: ['gia'],
  },
  {
    id: 'g-operations',
    name: 'Operations',
    description: 'Platform operations.',
    roles: ['OPERATOR'],
    memberIds: ['ops'],
  },
];

function user(
  id: string,
  displayName: string,
  status: UserDto['status'],
  accessLevel: UserDto['accessLevel'],
  team: string,
  roles: string[],
  groups: string[],
  permissions: string[],
): UserDto {
  return {
    id,
    username: id,
    displayName,
    email: `${id}@example.com`,
    status,
    accessLevel,
    team,
    roles,
    groups,
    permissions,
    lastActiveAt: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
  };
}

const USERS: readonly UserDto[] = [
  user(
    'ada',
    'Ada Researcher',
    'ACTIVE',
    'STANDARD',
    'Quant Research',
    ['RESEARCHER'],
    ['Quant Research'],
    ['app:research', 'research:read', 'research:propose'],
  ),
  user(
    'ben',
    'Ben Analyst',
    'ACTIVE',
    'STANDARD',
    'Quant Research',
    ['RESEARCHER'],
    ['Quant Research'],
    ['app:research', 'research:read', 'research:propose'],
  ),
  user(
    'gia',
    'Gia Governance',
    'ACTIVE',
    'ADMIN',
    'AI Governance',
    ['AI_GOVERNANCE'],
    ['AI Governance'],
    ['app:admin', 'agent:administer'],
  ),
  user(
    'ops',
    'Otto Operator',
    'ACTIVE',
    'ELEVATED',
    'Operations',
    ['OPERATOR'],
    ['Operations'],
    ['app:monitoring', 'monitoring:read'],
  ),
  user(
    'viv',
    'Viv Viewer',
    'SUSPENDED',
    'STANDARD',
    'External',
    ['VIEWER'],
    [],
    ['app:research', 'research:read'],
  ),
  user('ivy', 'Ivy Invitee', 'INVITED', 'STANDARD', 'Quant Research', [], [], []),
  user('dan', 'Dan Disabled', 'DISABLED', 'STANDARD', 'Former', [], [], []),
];

const DETAILS: Record<string, Pick<UserDetailDto, 'activity' | 'sessions'>> = {
  ada: {
    activity: [
      {
        id: 'a1',
        action: 'Proposed hypothesis',
        target: 'exp-momentum-reversal',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'a2',
        action: 'Signed in',
        target: 'research-web',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    sessions: [
      {
        id: 's1',
        device: 'Chrome · macOS',
        startedAt: '2026-08-01T00:00:00.000Z',
        lastSeenAt: '2026-08-02T00:00:00.000Z',
        status: 'ACTIVE',
      },
      {
        id: 's2',
        device: 'Safari · iOS',
        startedAt: '2026-07-20T00:00:00.000Z',
        lastSeenAt: '2026-07-21T00:00:00.000Z',
        status: 'EXPIRED',
      },
    ],
  },
  gia: {
    activity: [
      {
        id: 'a1',
        action: 'Reviewed agent EN-001',
        target: 'admin-web',
        occurredAt: '2026-07-30T00:00:00.000Z',
      },
    ],
    sessions: [
      {
        id: 's1',
        device: 'Firefox · Linux',
        startedAt: '2026-07-30T00:00:00.000Z',
        lastSeenAt: '2026-08-02T00:00:00.000Z',
        status: 'ACTIVE',
      },
    ],
  },
};

const USER_BY_ID = new Map(USERS.map((u) => [u.id, u] as const));

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockUserManagementRepository implements UserManagementRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listUsers(query: UserQuery): Promise<Page<UserDto>> {
    await this.delay();
    return applyUserQuery(USERS, query);
  }

  async getUser(id: string): Promise<UserDetailDto | null> {
    await this.delay();
    const base = USER_BY_ID.get(id);
    if (!base) return null;
    const extra = DETAILS[id] ?? { activity: [], sessions: [] };
    return { ...base, activity: extra.activity, sessions: extra.sessions };
  }

  async listGroups(): Promise<readonly GroupDto[]> {
    await this.delay();
    return GROUPS;
  }

  async listRoles(): Promise<readonly RoleDto[]> {
    await this.delay();
    return ROLES;
  }

  async getRole(id: string): Promise<RoleDto | null> {
    await this.delay();
    return ROLES.find((role) => role.id === id) ?? null;
  }

  async listPermissions(): Promise<readonly PermissionDto[]> {
    await this.delay();
    return PERMISSIONS;
  }

  async listPolicies(): Promise<readonly PolicyDto[]> {
    await this.delay();
    return POLICIES;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

const POLICIES: readonly PolicyDto[] = [
  {
    id: 'pol-1',
    name: 'Least privilege',
    description: 'Users receive the minimum roles required.',
    effect: 'ALLOW',
    appliesTo: 'users',
  },
  {
    id: 'pol-2',
    name: 'Counter-sign for elevation',
    description: 'Access elevation requires counter-sign (HO-2).',
    effect: 'DENY',
    appliesTo: 'access-levels',
  },
];

export const USER_MANAGEMENT_SEED = {
  users: USERS,
  roles: ROLES,
  groups: GROUPS,
  permissions: PERMISSIONS,
  policies: POLICIES,
} as const;
