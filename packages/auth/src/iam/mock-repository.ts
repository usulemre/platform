/**
 * @platform/auth · iam · mock-repository — in-memory identity directory for
 * development. Synthetic METADATA ONLY — no OAuth, no JWT, no persistence. Every
 * user is authority-capped by their roles; nothing here mints identity.
 */
import type { PermissionDto, PolicyDto, RoleDto, UserDto } from './dto';
import type { IamRepository } from './repository';

const PERMISSIONS: readonly PermissionDto[] = [
  {
    id: 'p-app-research',
    key: 'app:research',
    description: 'Access the research web console',
    category: 'application',
  },
  {
    id: 'p-app-admin',
    key: 'app:admin',
    description: 'Access the admin web console',
    category: 'application',
  },
  {
    id: 'p-app-monitoring',
    key: 'app:monitoring',
    description: 'Access the monitoring web console',
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
    description: 'Read operational monitoring',
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
  },
  {
    id: 'r-governance',
    name: 'AI_GOVERNANCE',
    description: 'Administers AI agents and governance.',
    permissions: ['app:admin', 'agent:administer'],
    apps: ['admin-web'],
  },
  {
    id: 'r-operator',
    name: 'OPERATOR',
    description: 'Monitors production operations.',
    permissions: ['app:monitoring', 'monitoring:read'],
    apps: ['monitoring-web'],
  },
  {
    id: 'r-viewer',
    name: 'VIEWER',
    description: 'Read-only access to research.',
    permissions: ['app:research', 'research:read'],
    apps: ['research-web'],
  },
];

const USERS: readonly UserDto[] = [
  {
    id: 'ada',
    username: 'ada',
    displayName: 'Ada Researcher',
    email: 'ada@example.com',
    status: 'ACTIVE',
    team: 'Quant Research',
    roles: ['RESEARCHER'],
    permissions: ['app:research', 'research:read', 'research:propose'],
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'gia',
    username: 'gia',
    displayName: 'Gia Governance',
    email: 'gia@example.com',
    status: 'ACTIVE',
    team: 'AI Governance',
    roles: ['AI_GOVERNANCE'],
    permissions: ['app:admin', 'agent:administer'],
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'ops',
    username: 'ops',
    displayName: 'Otto Operator',
    email: 'ops@example.com',
    status: 'ACTIVE',
    team: 'Operations',
    roles: ['OPERATOR'],
    permissions: ['app:monitoring', 'monitoring:read'],
    createdAt: '2026-02-01T00:00:00.000Z',
  },
];

const POLICIES: readonly PolicyDto[] = [
  {
    id: 'pol-1',
    name: 'Human override counter-sign',
    description: 'Capital-affecting overrides require counter-sign (HO-2).',
    effect: 'DENY',
    appliesTo: 'capital-overrides',
  },
  {
    id: 'pol-2',
    name: 'Agent authority ceiling',
    description: 'AI agents may never hold decide authority (AI-1..4).',
    effect: 'DENY',
    appliesTo: 'agents',
  },
  {
    id: 'pol-3',
    name: 'Application access',
    description: 'App access requires the matching app:* permission.',
    effect: 'ALLOW',
    appliesTo: 'applications',
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockIamRepository implements IamRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listUsers(): Promise<readonly UserDto[]> {
    await this.delay();
    return USERS;
  }

  async getUser(id: string): Promise<UserDto | null> {
    await this.delay();
    return USERS.find((user) => user.id === id) ?? null;
  }

  async listRoles(): Promise<readonly RoleDto[]> {
    await this.delay();
    return ROLES;
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

export const IAM_SEED = {
  users: USERS,
  roles: ROLES,
  permissions: PERMISSIONS,
  policies: POLICIES,
} as const;
