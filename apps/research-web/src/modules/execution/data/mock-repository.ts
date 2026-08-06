/**
 * In-memory mock adapter for development. Synthetic METADATA ONLY — no broker
 * APIs, no exchange connectivity, no order routing, no persistence (all out of
 * scope / forbidden). Statuses, authorization and risk verdicts are pre-supplied.
 * Portfolio/strategy/signal/risk references use ids from those modules' seeds so
 * cross-links resolve.
 */
import type { ExecutionRequestDto } from '../domain/dto';
import { applyExecutionQuery, type ExecutionQuery } from '../domain/query';
import type { ExecutionRepository } from './repository';

const SEED: readonly ExecutionRequestDto[] = [
  {
    id: 'exec-core-paper',
    slug: 'core-multi-strategy-paper',
    title: 'Core multi-strategy — paper execution',
    status: 'AUTHORIZED',
    mode: 'PAPER',
    authorization: {
      state: 'ISSUED',
      tokenRef: 'AUTH-2026-0731-CORE',
      issuedAt: '2026-07-29T00:00:00.000Z',
      expiresAt: '2026-08-05T00:00:00.000Z',
    },
    riskApproval: {
      assessmentId: 'risk-port-core',
      assessmentTitle: 'Core multi-strategy — risk assessment',
      verdict: 'PASS_WITH_CONDITIONS',
      riskLevel: 'ELEVATED',
      decidedAt: '2026-07-28T00:00:00.000Z',
    },
    portfolioRef: { id: 'port-core', name: 'Core multi-strategy', version: '2.0.0' },
    strategyRef: { id: 'str-reversal-ls', name: 'Reversal long/short', version: '1.1.0' },
    signalRef: { id: 'sig-reversal', name: 'Reversal signal', version: '1.3.0' },
    owner: 'Execution Operations',
    version: '1.0.0',
    registryId: 'EXE-000024',
    auditRef: 'audit/exec-core-paper',
    cancellable: true,
    createdAt: '2026-07-28T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    requestedAt: '2026-07-28T00:00:00.000Z',
    tags: ['paper', 'multi-asset', 'authorized'],
    validation: { status: 'PASSED', checkedAt: '2026-07-29T00:00:00.000Z', issues: [] },
    timeline: [
      {
        stage: 'requested',
        label: 'Execution requested',
        actor: 'Execution Operations',
        occurredAt: '2026-07-28T00:00:00.000Z',
      },
      {
        stage: 'approval',
        label: 'Risk approval (with conditions)',
        actor: 'Risk Management',
        occurredAt: '2026-07-29T00:00:00.000Z',
      },
      {
        stage: 'authorization',
        label: 'Authorization token issued',
        actor: 'Execution Governance',
        occurredAt: '2026-07-29T00:00:00.000Z',
      },
      { stage: 'run', label: 'Paper run' },
    ],
    workflow: {
      workflowRef: 'WFC-49',
      name: 'Production deployment',
      state: 'RUNNING',
      currentStage: 'Paper run',
    },
  },
  {
    id: 'exec-mn-pending',
    slug: 'equity-market-neutral-paper',
    title: 'Equity market-neutral — paper execution',
    status: 'PENDING_APPROVAL',
    mode: 'PAPER',
    authorization: { state: 'NOT_ISSUED' },
    riskApproval: {
      assessmentId: 'risk-equity-mn',
      assessmentTitle: 'Equity market-neutral — risk assessment',
      verdict: 'PASS',
      riskLevel: 'LOW',
      decidedAt: '2026-07-22T00:00:00.000Z',
    },
    portfolioRef: { id: 'port-equity-mn', name: 'Equity market-neutral', version: '0.8.0' },
    strategyRef: { id: 'str-multi-equity', name: 'Multi-signal equity', version: '0.9.0' },
    owner: 'Execution Operations',
    version: '0.4.0',
    registryId: 'EXE-000031',
    cancellable: true,
    createdAt: '2026-07-24T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    requestedAt: '2026-07-24T00:00:00.000Z',
    tags: ['paper', 'equity'],
    validation: { status: 'PASSED', checkedAt: '2026-07-24T00:00:00.000Z', issues: [] },
    timeline: [
      {
        stage: 'requested',
        label: 'Execution requested',
        actor: 'Execution Operations',
        occurredAt: '2026-07-24T00:00:00.000Z',
      },
      { stage: 'approval', label: 'Governance approval' },
      { stage: 'authorization', label: 'Authorization token' },
      { stage: 'run', label: 'Paper run' },
    ],
    workflow: {
      workflowRef: 'WFC-49',
      name: 'Production deployment',
      state: 'PENDING',
      currentStage: 'Governance approval',
    },
  },
  {
    id: 'exec-fx-rejected',
    slug: 'fx-carry-execution',
    title: 'FX carry execution candidate',
    status: 'REJECTED',
    mode: 'PAPER',
    authorization: { state: 'NOT_ISSUED' },
    riskApproval: {
      assessmentId: 'risk-fx-exec',
      assessmentTitle: 'FX carry execution candidate — risk assessment',
      verdict: 'FAIL',
      riskLevel: 'HIGH',
      decidedAt: '2026-07-29T00:00:00.000Z',
    },
    portfolioRef: { id: 'port-core', name: 'Core multi-strategy', version: '2.0.0' },
    strategyRef: { id: 'str-fx-carry', name: 'FX carry', version: '0.6.0' },
    signalRef: { id: 'sig-fx-carry', name: 'FX carry signal', version: '0.8.0' },
    owner: 'Execution Operations',
    version: '0.2.0',
    registryId: 'EXE-000038',
    auditRef: 'audit/exec-fx-rejected',
    cancellable: false,
    createdAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    requestedAt: '2026-07-22T00:00:00.000Z',
    tags: ['paper', 'fx', 'rejected'],
    validation: {
      status: 'FAILED',
      checkedAt: '2026-07-29T00:00:00.000Z',
      issues: [
        {
          code: 'EXE-LIQ-009',
          severity: 'ERROR',
          message: 'Rejected: risk assessment failed on liquidity floor.',
        },
      ],
    },
    timeline: [
      {
        stage: 'requested',
        label: 'Execution requested',
        actor: 'Execution Operations',
        occurredAt: '2026-07-22T00:00:00.000Z',
      },
      {
        stage: 'approval',
        label: 'Risk approval failed',
        actor: 'Risk Management',
        occurredAt: '2026-07-29T00:00:00.000Z',
      },
      {
        stage: 'rejected',
        label: 'Request rejected',
        actor: 'Execution Governance',
        occurredAt: '2026-07-29T00:00:00.000Z',
      },
    ],
    workflow: {
      workflowRef: 'WFC-49',
      name: 'Production deployment',
      state: 'BLOCKED',
      currentStage: 'Rejected',
    },
  },
  {
    id: 'exec-core-completed',
    slug: 'core-multi-strategy-completed',
    title: 'Core multi-strategy — completed paper run',
    status: 'COMPLETED',
    mode: 'PAPER',
    authorization: {
      state: 'EXPIRED',
      tokenRef: 'AUTH-2026-0701-CORE',
      issuedAt: '2026-07-01T00:00:00.000Z',
      expiresAt: '2026-07-08T00:00:00.000Z',
    },
    riskApproval: {
      assessmentId: 'risk-equity-mn',
      assessmentTitle: 'Equity market-neutral — risk assessment',
      verdict: 'PASS',
      riskLevel: 'LOW',
      decidedAt: '2026-06-28T00:00:00.000Z',
    },
    portfolioRef: { id: 'port-core', name: 'Core multi-strategy', version: '1.0.0' },
    owner: 'Execution Operations',
    version: '1.0.0',
    registryId: 'EXE-000011',
    auditRef: 'audit/exec-core-completed',
    cancellable: false,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    requestedAt: '2026-07-01T00:00:00.000Z',
    tags: ['paper', 'completed'],
    validation: { status: 'PASSED', checkedAt: '2026-07-01T00:00:00.000Z', issues: [] },
    timeline: [
      {
        stage: 'requested',
        label: 'Execution requested',
        actor: 'Execution Operations',
        occurredAt: '2026-07-01T00:00:00.000Z',
      },
      {
        stage: 'authorization',
        label: 'Authorization token issued',
        actor: 'Execution Governance',
        occurredAt: '2026-07-01T00:00:00.000Z',
      },
      {
        stage: 'run',
        label: 'Paper run',
        actor: 'Execution Operations',
        occurredAt: '2026-07-02T00:00:00.000Z',
      },
      {
        stage: 'completed',
        label: 'Completed',
        actor: 'Execution Operations',
        occurredAt: '2026-07-08T00:00:00.000Z',
      },
    ],
    workflow: {
      workflowRef: 'WFC-49',
      name: 'Production deployment',
      state: 'COMPLETED',
      currentStage: 'Completed',
    },
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockExecutionRepository implements ExecutionRepository {
  private readonly data: readonly ExecutionRequestDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly ExecutionRequestDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: ExecutionQuery): Promise<readonly ExecutionRequestDto[]> {
    await this.delay();
    return applyExecutionQuery(this.data, query);
  }

  async getById(id: string): Promise<ExecutionRequestDto | null> {
    await this.delay();
    return this.data.find((request) => request.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const EXECUTION_SEED = SEED;
