/**
 * In-memory mock adapter for development. Synthetic METADATA ONLY — no LLM
 * providers, no model inference, no prompt execution, no persistence (all out of
 * scope / forbidden). Every agent is advisory (PROPOSES/NARRATES/OBSERVES); none
 * decides. Roster mirrors the Agent Registry (REG). Model bindings are pinned
 * metadata only.
 */
import type { AgentDto } from '../domain/dto';
import { applyAgentQuery, type AgentQuery } from '../domain/query';
import type { AgentRepository } from './repository';

const SEED: readonly AgentDto[] = [
  {
    id: 'RD-001',
    slug: 'research-discovery-primary',
    name: 'Research discovery',
    description: 'Advisory literature mining and hypothesis drafting agent.',
    category: 'research-discovery',
    status: 'ACTIVE',
    authority: 'PROPOSES',
    owner: 'HAI',
    team: 'AI Governance',
    version: '2.1.0',
    model: { id: 'claude-opus-4-8', version: '2026-01', pinned: true },
    contractRef: 'AGC-RD-001',
    contractVersion: '2.1',
    capabilities: ['literature-mining', 'hypothesis-drafting', 'priority-proposals'],
    permissions: ['bus:research.propose', 'memory:semantic.read'],
    workflowAssignments: [{ workflowRef: 'WFC-43', name: 'Research discovery', role: 'proposer' }],
    evaluation: {
      gate: 'PASSED',
      score: '0.94 golden-set',
      drift: 'STABLE',
      lastEvaluated: '2026-07-20T00:00:00.000Z',
    },
    performance: {
      invocations: '12,480',
      avgLatency: '3.2s',
      costToDate: '$412',
      tokensToDate: '48.1M',
    },
    health: { status: 'HEALTHY', message: 'Nominal.', lastSeen: '2026-08-02T00:00:00.000Z' },
    validation: { status: 'PASSED', checkedAt: '2026-07-20T00:00:00.000Z', issues: [] },
    lifecycle: [
      { stage: 'registered', label: 'Registered', occurredAt: '2026-03-01T00:00:00.000Z' },
      {
        stage: 'evaluated',
        label: 'Evaluation gate passed',
        occurredAt: '2026-07-20T00:00:00.000Z',
      },
      { stage: 'active', label: 'Active', occurredAt: '2026-07-21T00:00:00.000Z' },
      { stage: 'retirement', label: 'Retirement' },
    ],
    activity: [
      {
        id: 'a1',
        label: 'Proposed 4 hypotheses',
        actor: 'RD-001',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'a2',
        label: 'Evaluation re-run (drift monitor)',
        actor: 'MRC',
        occurredAt: '2026-07-20T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '2.1.0',
        registeredAt: '2026-07-21T00:00:00.000Z',
        note: 'Prompt v-hash bump; re-evaluated.',
      },
      { version: '2.0.0', registeredAt: '2026-03-01T00:00:00.000Z', note: 'Initial registration.' },
    ],
    registryId: 'REG-RD-001',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    registeredAt: '2026-03-01T00:00:00.000Z',
    tags: ['research', 'advisory', 'proposer'],
  },
  {
    id: 'VN-001',
    slug: 'validation-narrator',
    name: 'Validation narrator',
    description: 'Narrates deterministic validation verdicts; never asserts significance.',
    category: 'validation-narrator',
    status: 'ACTIVE',
    authority: 'NARRATES',
    owner: 'HAI',
    team: 'AI Governance',
    version: '1.4.0',
    model: { id: 'claude-sonnet-4-6', version: '2026-01', pinned: true },
    contractRef: 'AGC-VN-001',
    contractVersion: '1.4',
    capabilities: ['narration', 'explanation'],
    permissions: ['bus:validation.narrate.read'],
    workflowAssignments: [{ workflowRef: 'WFC-46', name: 'Validation', role: 'narrator' }],
    evaluation: {
      gate: 'PASSED',
      score: '0.97 golden-set',
      drift: 'STABLE',
      lastEvaluated: '2026-07-15T00:00:00.000Z',
    },
    performance: {
      invocations: '8,910',
      avgLatency: '2.1s',
      costToDate: '$180',
      tokensToDate: '21.4M',
    },
    health: { status: 'HEALTHY', message: 'Nominal.', lastSeen: '2026-08-02T00:00:00.000Z' },
    validation: { status: 'PASSED', checkedAt: '2026-07-15T00:00:00.000Z', issues: [] },
    lifecycle: [
      { stage: 'registered', label: 'Registered', occurredAt: '2026-02-10T00:00:00.000Z' },
      {
        stage: 'evaluated',
        label: 'Evaluation gate passed',
        occurredAt: '2026-07-15T00:00:00.000Z',
      },
      { stage: 'active', label: 'Active', occurredAt: '2026-07-16T00:00:00.000Z' },
      { stage: 'retirement', label: 'Retirement' },
    ],
    activity: [
      {
        id: 'a1',
        label: 'Narrated 12 verdicts',
        actor: 'VN-001',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.4.0',
        registeredAt: '2026-07-16T00:00:00.000Z',
        note: 'Narration template refined.',
      },
    ],
    registryId: 'REG-VN-001',
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    registeredAt: '2026-02-10T00:00:00.000Z',
    tags: ['validation', 'narrator', 'advisory'],
  },
  {
    id: 'FD-002',
    slug: 'feature-discovery-secondary',
    name: 'Feature discovery (B)',
    description: 'Advisory feature proposal agent, currently under re-evaluation.',
    category: 'feature-discovery',
    status: 'UNDER_EVALUATION',
    authority: 'PROPOSES',
    owner: 'HAI',
    team: 'AI Governance',
    version: '0.9.0',
    model: { id: 'claude-opus-4-8', version: '2026-01', pinned: true },
    contractRef: 'AGC-FD-002',
    contractVersion: '0.9',
    capabilities: ['feature-proposals', 'ontology-classification'],
    permissions: ['bus:feature.propose'],
    workflowAssignments: [{ workflowRef: 'WFC-44', name: 'Feature research', role: 'proposer' }],
    evaluation: {
      gate: 'PENDING',
      score: '—',
      drift: 'NOT_MONITORED',
      lastEvaluated: '2026-07-28T00:00:00.000Z',
    },
    performance: {
      invocations: '2,140',
      avgLatency: '3.9s',
      costToDate: '$96',
      tokensToDate: '11.0M',
    },
    health: {
      status: 'DEGRADED',
      message: 'Suspended from production paths during evaluation.',
      lastSeen: '2026-07-30T00:00:00.000Z',
    },
    validation: {
      status: 'PENDING',
      checkedAt: '2026-07-28T00:00:00.000Z',
      issues: [
        {
          code: 'EVAL-003',
          severity: 'WARNING',
          message: 'Golden-set eval in progress; not production-eligible.',
        },
      ],
    },
    lifecycle: [
      { stage: 'registered', label: 'Registered', occurredAt: '2026-06-01T00:00:00.000Z' },
      { stage: 'evaluated', label: 'Evaluation gate' },
      { stage: 'active', label: 'Active' },
      { stage: 'retirement', label: 'Retirement' },
    ],
    activity: [
      {
        id: 'a1',
        label: 'Submitted for evaluation',
        actor: 'HAI',
        occurredAt: '2026-07-28T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '0.9.0',
        registeredAt: '2026-06-01T00:00:00.000Z',
        note: 'Registered; awaiting eval gate.',
      },
    ],
    registryId: 'REG-FD-002',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    registeredAt: '2026-06-01T00:00:00.000Z',
    tags: ['feature', 'proposer', 'evaluation'],
  },
  {
    id: 'MO-001',
    slug: 'monitoring-narrator',
    name: 'Monitoring narrator',
    description: 'Narrates monitoring/parity signals; observes only.',
    category: 'monitoring-narrator',
    status: 'ACTIVE',
    authority: 'NARRATES',
    owner: 'HSRE',
    team: 'Operations',
    version: '1.1.0',
    model: { id: 'claude-haiku-4-5', version: '2025-10', pinned: true },
    contractRef: 'AGC-MO-001',
    contractVersion: '1.1',
    capabilities: ['narration', 'summarization'],
    permissions: ['bus:monitoring.narrate.read'],
    workflowAssignments: [],
    evaluation: {
      gate: 'PASSED',
      score: '0.95 golden-set',
      drift: 'STABLE',
      lastEvaluated: '2026-07-10T00:00:00.000Z',
    },
    performance: {
      invocations: '5,020',
      avgLatency: '1.4s',
      costToDate: '$44',
      tokensToDate: '6.2M',
    },
    health: { status: 'HEALTHY', message: 'Nominal.', lastSeen: '2026-08-02T00:00:00.000Z' },
    validation: { status: 'PASSED', checkedAt: '2026-07-10T00:00:00.000Z', issues: [] },
    lifecycle: [
      { stage: 'registered', label: 'Registered', occurredAt: '2026-04-01T00:00:00.000Z' },
      {
        stage: 'evaluated',
        label: 'Evaluation gate passed',
        occurredAt: '2026-07-10T00:00:00.000Z',
      },
      { stage: 'active', label: 'Active', occurredAt: '2026-07-11T00:00:00.000Z' },
      { stage: 'retirement', label: 'Retirement' },
    ],
    activity: [
      {
        id: 'a1',
        label: 'Summarized daily parity report',
        actor: 'MO-001',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    versions: [
      { version: '1.1.0', registeredAt: '2026-07-11T00:00:00.000Z', note: 'Latency tuning.' },
    ],
    registryId: 'REG-MO-001',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    registeredAt: '2026-04-01T00:00:00.000Z',
    tags: ['monitoring', 'narrator', 'advisory'],
  },
  {
    id: 'EN-001',
    slug: 'engineering-agent',
    name: 'Engineering',
    description: 'Advisory engineering assistant, suspended pending contract review.',
    category: 'engineering',
    status: 'SUSPENDED',
    authority: 'PROPOSES',
    owner: 'PE',
    team: 'Platform Engineering',
    version: '0.6.0',
    model: { id: 'claude-opus-4-8', version: '2026-01', pinned: true },
    contractRef: 'AGC-EN-001',
    contractVersion: '0.6',
    capabilities: ['code-proposals', 'documentation-drafting'],
    permissions: ['bus:engineering.propose'],
    workflowAssignments: [],
    evaluation: {
      gate: 'PASSED',
      score: '0.90 golden-set',
      drift: 'DRIFTING',
      lastEvaluated: '2026-06-30T00:00:00.000Z',
    },
    performance: {
      invocations: '9,730',
      avgLatency: '4.5s',
      costToDate: '$310',
      tokensToDate: '33.7M',
    },
    health: {
      status: 'UNKNOWN',
      message: 'Suspended; not currently reporting.',
      lastSeen: '2026-07-25T00:00:00.000Z',
    },
    validation: {
      status: 'FAILED',
      checkedAt: '2026-07-25T00:00:00.000Z',
      issues: [
        {
          code: 'DRIFT-002',
          severity: 'ERROR',
          message: 'Behavioral drift detected; suspended pending re-evaluation.',
        },
      ],
    },
    lifecycle: [
      { stage: 'registered', label: 'Registered', occurredAt: '2026-05-01T00:00:00.000Z' },
      { stage: 'active', label: 'Active', occurredAt: '2026-05-05T00:00:00.000Z' },
      { stage: 'suspended', label: 'Suspended (drift)', occurredAt: '2026-07-25T00:00:00.000Z' },
      { stage: 'retirement', label: 'Retirement' },
    ],
    activity: [
      {
        id: 'a1',
        label: 'Suspended by drift monitor',
        actor: 'MRC',
        occurredAt: '2026-07-25T00:00:00.000Z',
      },
    ],
    versions: [
      { version: '0.6.0', registeredAt: '2026-05-01T00:00:00.000Z', note: 'Initial registration.' },
    ],
    registryId: 'REG-EN-001',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-07-25T00:00:00.000Z',
    registeredAt: '2026-05-01T00:00:00.000Z',
    tags: ['engineering', 'proposer', 'suspended'],
  },
  {
    id: 'AN-001',
    slug: 'analysis-agent-legacy',
    name: 'Analysis (legacy)',
    description: 'Retired analysis agent superseded by RD-001.',
    category: 'analysis',
    status: 'RETIRED',
    authority: 'PROPOSES',
    owner: 'HAI',
    team: 'AI Governance',
    version: '1.0.0',
    model: { id: 'claude-sonnet-4-6', version: '2025-08', pinned: true },
    contractRef: 'AGC-AN-001',
    contractVersion: '1.0',
    capabilities: ['company-research'],
    permissions: [],
    workflowAssignments: [],
    evaluation: { gate: 'NOT_RUN', score: '—', drift: 'NOT_MONITORED', lastEvaluated: undefined },
    performance: { invocations: '—', avgLatency: '—', costToDate: '—', tokensToDate: '—' },
    health: { status: 'DOWN', message: 'Retired.', lastSeen: '2026-05-01T00:00:00.000Z' },
    validation: { status: 'NOT_RUN', issues: [] },
    lifecycle: [
      { stage: 'registered', label: 'Registered', occurredAt: '2026-01-10T00:00:00.000Z' },
      { stage: 'active', label: 'Active', occurredAt: '2026-01-15T00:00:00.000Z' },
      { stage: 'retired', label: 'Retired (superseded)', occurredAt: '2026-05-01T00:00:00.000Z' },
    ],
    activity: [
      {
        id: 'a1',
        label: 'Retired; superseded by RD-001',
        actor: 'HAI',
        occurredAt: '2026-05-01T00:00:00.000Z',
      },
    ],
    versions: [
      { version: '1.0.0', registeredAt: '2026-01-10T00:00:00.000Z', note: 'Initial registration.' },
    ],
    registryId: 'REG-AN-001',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    registeredAt: '2026-01-10T00:00:00.000Z',
    tags: ['analysis', 'retired'],
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockAgentRepository implements AgentRepository {
  private readonly data: readonly AgentDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly AgentDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: AgentQuery): Promise<readonly AgentDto[]> {
    await this.delay();
    return applyAgentQuery(this.data, query);
  }

  async getById(id: string): Promise<AgentDto | null> {
    await this.delay();
    return this.data.find((agent) => agent.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const AGENT_SEED = SEED;
