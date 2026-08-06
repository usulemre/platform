/**
 * In-memory mock adapter for development. Synthetic METADATA ONLY — no VaR
 * computation, no optimization, no persistence (all out of scope / forbidden).
 * All risk numbers, verdicts and statuses are pre-supplied. Subject/strategy
 * references use ids from the Portfolio/Strategy module seeds so cross-links
 * resolve.
 */
import type { RiskAssessmentDto } from '../domain/dto';
import { applyRiskQuery, type RiskQuery } from '../domain/query';
import type { RiskRepository } from './repository';

const SEED: readonly RiskAssessmentDto[] = [
  {
    id: 'risk-port-core',
    slug: 'core-multi-strategy-risk',
    title: 'Core multi-strategy — risk assessment',
    subjectKind: 'PORTFOLIO',
    subjectId: 'port-core',
    subjectName: 'Core multi-strategy',
    status: 'UNDER_REVIEW',
    verdict: 'PASS_WITH_CONDITIONS',
    riskLevel: 'ELEVATED',
    executionRecommendation: 'PAPER_ONLY',
    owner: 'Risk Management',
    version: '1.0.0',
    registryId: 'RISK-000051',
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
    assessedAt: '2026-07-27T00:00:00.000Z',
    expiresAt: '2026-08-27T00:00:00.000Z',
    tags: ['multi-asset', 'paper', 'conditions'],
    validation: {
      status: 'PASSED',
      checkedAt: '2026-07-27T00:00:00.000Z',
      issues: [
        {
          code: 'CON-102',
          severity: 'WARNING',
          message: 'Single-strategy concentration constraint breached.',
        },
      ],
    },
    portfolioRisk: [
      { key: 'gross', label: 'Gross exposure', value: '210%', limit: '250%', status: 'WITHIN' },
      { key: 'net', label: 'Net exposure', value: '18%', limit: '±30%', status: 'WITHIN' },
      { key: 'var', label: 'VaR (95%, provided)', value: '1.4%', limit: '2.0%', status: 'WITHIN' },
      { key: 'liquidity', label: 'Liquidity (5d)', value: '94%', limit: '90%', status: 'WITHIN' },
    ],
    strategyRisk: [
      {
        strategyId: 'str-reversal-ls',
        name: 'Reversal long/short',
        level: 'MODERATE',
        note: 'Concentration elevated.',
      },
      {
        strategyId: 'str-fx-carry',
        name: 'FX carry',
        level: 'ELEVATED',
        note: 'Crowding risk under review.',
      },
    ],
    exposures: [
      { key: 'equity', label: 'Equity gross', value: '120%', limit: '150%', status: 'WITHIN' },
      { key: 'fx', label: 'FX gross', value: '70%', limit: '80%', status: 'ELEVATED' },
      {
        key: 'single-name',
        label: 'Largest single name',
        value: '2.6%',
        limit: '3%',
        status: 'WITHIN',
      },
    ],
    constraints: [
      {
        key: 'max-strategy',
        label: 'Max single strategy',
        limit: '50%',
        value: '55%',
        status: 'BREACHED',
      },
      {
        key: 'leverage',
        label: 'Gross leverage',
        limit: '2.5x',
        value: '2.1x',
        status: 'SATISFIED',
      },
      {
        key: 'liquidity',
        label: 'Min liquidity',
        limit: '90% in 5d',
        value: '94%',
        status: 'SATISFIED',
      },
    ],
    policyRefs: [
      { code: 'RB-13 · RISK §4.2', title: 'Concentration limits' },
      { code: 'RB-13 · RISK §5.1', title: 'Leverage and liquidity limits' },
    ],
    exceptions: [
      {
        code: 'EXC-014',
        description: 'Temporary waiver of single-strategy limit pending rebalance.',
        status: 'OPEN',
      },
    ],
    timeline: [
      {
        stage: 'registered',
        label: 'Assessment registered',
        actor: 'Risk Management',
        occurredAt: '2026-07-20T00:00:00.000Z',
      },
      {
        stage: 'exposure',
        label: 'Exposure review',
        actor: 'Risk Management',
        occurredAt: '2026-07-25T00:00:00.000Z',
      },
      { stage: 'decision', label: 'Risk decision' },
    ],
    workflow: {
      workflowRef: 'WFC-47',
      name: 'Risk review',
      state: 'RUNNING',
      currentStage: 'Risk decision',
    },
  },
  {
    id: 'risk-equity-mn',
    slug: 'equity-market-neutral-risk',
    title: 'Equity market-neutral — risk assessment',
    subjectKind: 'PORTFOLIO',
    subjectId: 'port-equity-mn',
    subjectName: 'Equity market-neutral',
    status: 'APPROVED',
    verdict: 'PASS',
    riskLevel: 'LOW',
    executionRecommendation: 'ELIGIBLE_PENDING_TOKEN',
    owner: 'Risk Management',
    version: '1.0.0',
    registryId: 'RISK-000047',
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-24T00:00:00.000Z',
    assessedAt: '2026-07-22T00:00:00.000Z',
    expiresAt: '2026-08-22T00:00:00.000Z',
    tags: ['equity', 'market-neutral'],
    validation: { status: 'PASSED', checkedAt: '2026-07-22T00:00:00.000Z', issues: [] },
    portfolioRisk: [
      { key: 'gross', label: 'Gross exposure', value: '180%', limit: '200%', status: 'WITHIN' },
      { key: 'net', label: 'Net exposure', value: '2%', limit: '±10%', status: 'WITHIN' },
      { key: 'beta', label: 'Market beta', value: '0.04', limit: '±0.1', status: 'WITHIN' },
    ],
    strategyRisk: [
      {
        strategyId: 'str-multi-equity',
        name: 'Multi-signal equity',
        level: 'LOW',
        note: 'Balanced book.',
      },
    ],
    exposures: [
      { key: 'equity', label: 'Equity gross', value: '180%', limit: '200%', status: 'WITHIN' },
      {
        key: 'single-name',
        label: 'Largest single name',
        value: '1.9%',
        limit: '2%',
        status: 'ELEVATED',
      },
    ],
    constraints: [
      { key: 'max-name', label: 'Max single name', limit: '2%', value: '1.9%', status: 'WARNING' },
      { key: 'beta', label: 'Market beta', limit: '±0.1', value: '0.04', status: 'SATISFIED' },
    ],
    policyRefs: [{ code: 'RB-13 · RISK §4.1', title: 'Market-neutral beta bounds' }],
    exceptions: [],
    timeline: [
      {
        stage: 'registered',
        label: 'Assessment registered',
        actor: 'Risk Management',
        occurredAt: '2026-07-10T00:00:00.000Z',
      },
      {
        stage: 'exposure',
        label: 'Exposure review',
        actor: 'Risk Management',
        occurredAt: '2026-07-18T00:00:00.000Z',
      },
      {
        stage: 'decision',
        label: 'Approved',
        actor: 'Risk Management',
        occurredAt: '2026-07-22T00:00:00.000Z',
      },
    ],
    workflow: {
      workflowRef: 'WFC-47',
      name: 'Risk review',
      state: 'COMPLETED',
      currentStage: 'Approved',
    },
  },
  {
    id: 'risk-fx-exec',
    slug: 'fx-carry-execution-candidate-risk',
    title: 'FX carry execution candidate — risk assessment',
    subjectKind: 'EXECUTION_CANDIDATE',
    subjectId: 'exec-fx-carry-001',
    subjectName: 'FX carry paper execution candidate',
    status: 'ESCALATED',
    verdict: 'FAIL',
    riskLevel: 'HIGH',
    executionRecommendation: 'DO_NOT_DEPLOY',
    owner: 'Risk Management',
    version: '0.3.0',
    registryId: 'RISK-000063',
    createdAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    assessedAt: '2026-07-29T00:00:00.000Z',
    tags: ['fx', 'execution', 'escalated'],
    validation: {
      status: 'FAILED',
      checkedAt: '2026-07-29T00:00:00.000Z',
      issues: [
        {
          code: 'LIQ-009',
          severity: 'ERROR',
          message: 'Liquidity below policy floor for proposed size.',
        },
      ],
    },
    portfolioRisk: [],
    strategyRisk: [
      {
        strategyId: 'str-fx-carry',
        name: 'FX carry',
        level: 'HIGH',
        note: 'Under validation; not portfolio-eligible.',
      },
    ],
    exposures: [
      {
        key: 'notional',
        label: 'Proposed notional',
        value: '—',
        limit: 'Policy floor',
        status: 'BREACHED',
      },
      { key: 'liquidity', label: 'Liquidity (5d)', value: '61%', limit: '90%', status: 'BREACHED' },
    ],
    constraints: [
      {
        key: 'liquidity',
        label: 'Min liquidity',
        limit: '90% in 5d',
        value: '61%',
        status: 'BREACHED',
      },
      {
        key: 'paper-first',
        label: 'Paper-first required',
        limit: 'Required',
        value: 'Not met',
        status: 'BREACHED',
      },
    ],
    policyRefs: [
      { code: 'RB-13 · RISK §6.3', title: 'Liquidity floors' },
      { code: 'Execution Governance §2.9', title: 'Paper-first and token gating' },
    ],
    exceptions: [
      { code: 'EXC-021', description: 'Request to bypass paper-first.', status: 'REJECTED' },
    ],
    timeline: [
      {
        stage: 'registered',
        label: 'Assessment registered',
        actor: 'Risk Management',
        occurredAt: '2026-07-22T00:00:00.000Z',
      },
      {
        stage: 'exposure',
        label: 'Exposure review',
        actor: 'Risk Management',
        occurredAt: '2026-07-28T00:00:00.000Z',
      },
      {
        stage: 'escalation',
        label: 'Escalated to committee',
        actor: 'Risk Management',
        occurredAt: '2026-07-29T00:00:00.000Z',
      },
      { stage: 'decision', label: 'Committee decision' },
    ],
    workflow: {
      workflowRef: 'WFC-47',
      name: 'Risk review',
      state: 'BLOCKED',
      currentStage: 'Committee escalation',
    },
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockRiskRepository implements RiskRepository {
  private readonly data: readonly RiskAssessmentDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly RiskAssessmentDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: RiskQuery): Promise<readonly RiskAssessmentDto[]> {
    await this.delay();
    return applyRiskQuery(this.data, query);
  }

  async getById(id: string): Promise<RiskAssessmentDto | null> {
    await this.delay();
    return this.data.find((assessment) => assessment.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const RISK_SEED = SEED;
