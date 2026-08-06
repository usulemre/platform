/**
 * In-memory mock adapter for development. Synthetic METADATA ONLY — no trading
 * algorithms, no optimization, no statistics, no persistence (all out of scope /
 * forbidden). Signal/experiment references use ids from those modules' seeds so
 * cross-links resolve. Weights and risk statuses are pre-supplied metadata.
 */
import type { StrategyDto } from '../domain/dto';
import { applyStrategyQuery, type StrategyQuery } from '../domain/query';
import type { StrategyRepository } from './repository';

const SEED: readonly StrategyDto[] = [
  {
    id: 'str-reversal-ls',
    slug: 'reversal-long-short',
    name: 'Reversal long/short',
    description: 'Advisory long/short strategy driven by the short-horizon reversal signal.',
    category: 'REVERSAL',
    assetClass: 'EQUITY',
    owner: 'Portfolio Research',
    version: '1.1.0',
    status: 'APPROVED',
    approval: {
      state: 'APPROVED',
      submittedAt: '2026-06-01T00:00:00.000Z',
      decidedAt: '2026-06-12T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    portfolioEligibility: 'ELIGIBLE',
    provenanceComplete: true,
    manifestRef: 'manifest/str-reversal-ls@1.1.0',
    registryId: 'STR-000045',
    backtestRef: 'backtest/str-reversal-ls@1.1.0',
    createdAt: '2026-05-20T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    registeredAt: '2026-05-22T00:00:00.000Z',
    tags: ['equity', 'reversal', 'long-short'],
    validation: { status: 'PASSED', checkedAt: '2026-06-12T00:00:00.000Z', issues: [] },
    risk: [
      { key: 'gross', label: 'Gross exposure', value: '180%', limit: '200%', status: 'WITHIN' },
      { key: 'net', label: 'Net exposure', value: '5%', limit: '±20%', status: 'WITHIN' },
      { key: 'dd', label: 'Max drawdown (limit)', value: '—', limit: '15%', status: 'WITHIN' },
      {
        key: 'conc',
        label: 'Concentration',
        value: 'Moderate',
        limit: '5% / name',
        status: 'ELEVATED',
      },
    ],
    composition: [
      { signalId: 'sig-reversal', name: 'Reversal signal', assetClass: 'EQUITY', weight: '100%' },
    ],
    portfolioRefs: [{ id: 'port-core', name: 'Core multi-strategy' }],
    experimentRefs: [
      { id: 'exp-momentum-reversal', name: 'Short-horizon reversal in US equities' },
    ],
    versions: [
      {
        version: '1.1.0',
        registeredAt: '2026-07-01T00:00:00.000Z',
        note: 'Risk limits tightened.',
      },
      {
        version: '1.0.0',
        registeredAt: '2026-05-22T00:00:00.000Z',
        note: 'Initial approved release.',
      },
    ],
    lineage: [
      { id: 'sig-reversal', label: 'Reversal signal', kind: 'signal' },
      { id: 'str-reversal-ls', label: 'Reversal long/short', kind: 'strategy' },
    ],
    workflow: {
      workflowRef: 'WFC-47',
      name: 'Risk review',
      state: 'COMPLETED',
      currentStage: 'Approved',
    },
    timeline: [
      { stage: 'registered', label: 'Strategy registered', occurredAt: '2026-05-22T00:00:00.000Z' },
      { stage: 'validation', label: 'Validation', occurredAt: '2026-06-05T00:00:00.000Z' },
      { stage: 'review', label: 'Risk review', occurredAt: '2026-06-10T00:00:00.000Z' },
      {
        stage: 'approved',
        label: 'Approved for portfolio',
        occurredAt: '2026-06-12T00:00:00.000Z',
      },
    ],
  },
  {
    id: 'str-fx-carry',
    slug: 'fx-carry',
    name: 'FX carry',
    description: 'Advisory carry strategy across G10 FX (under validation).',
    category: 'CARRY',
    assetClass: 'FX',
    owner: 'Portfolio Research',
    version: '0.6.0',
    status: 'UNDER_VALIDATION',
    approval: { state: 'PENDING', submittedAt: '2026-07-08T00:00:00.000Z' },
    portfolioEligibility: 'NOT_ELIGIBLE',
    provenanceComplete: true,
    manifestRef: 'manifest/str-fx-carry@0.6.0',
    registryId: 'STR-000061',
    createdAt: '2026-06-25T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    registeredAt: '2026-06-27T00:00:00.000Z',
    tags: ['fx', 'carry'],
    validation: { status: 'PENDING', issues: [] },
    risk: [
      { key: 'gross', label: 'Gross exposure', value: '120%', limit: '150%', status: 'WITHIN' },
      { key: 'var', label: 'VaR (95%)', value: 'Not assessed', status: 'NOT_ASSESSED' },
    ],
    composition: [
      { signalId: 'sig-fx-carry', name: 'FX carry signal', assetClass: 'FX', weight: '100%' },
    ],
    portfolioRefs: [],
    experimentRefs: [{ id: 'exp-carry-fx', name: 'FX carry with crowding adjustment' }],
    versions: [
      {
        version: '0.6.0',
        registeredAt: '2026-06-27T00:00:00.000Z',
        note: 'Submitted for validation.',
      },
    ],
    lineage: [
      { id: 'sig-fx-carry', label: 'FX carry signal', kind: 'signal' },
      { id: 'str-fx-carry', label: 'FX carry', kind: 'strategy' },
    ],
    workflow: {
      workflowRef: 'WFC-46',
      name: 'Validation',
      state: 'RUNNING',
      currentStage: 'Purged/embargoed CV',
    },
    timeline: [
      { stage: 'registered', label: 'Strategy registered', occurredAt: '2026-06-27T00:00:00.000Z' },
      { stage: 'validation', label: 'Validation' },
      { stage: 'review', label: 'Risk review' },
      { stage: 'approved', label: 'Approved for portfolio' },
    ],
  },
  {
    id: 'str-multi-equity',
    slug: 'multi-signal-equity',
    name: 'Multi-signal equity',
    description: 'Advisory blend of reversal and market-neutral signals (under review).',
    category: 'BLEND',
    assetClass: 'EQUITY',
    owner: 'Portfolio Research',
    version: '0.9.0',
    status: 'UNDER_REVIEW',
    approval: { state: 'PENDING', submittedAt: '2026-07-15T00:00:00.000Z' },
    portfolioEligibility: 'UNDER_REVIEW',
    provenanceComplete: true,
    manifestRef: 'manifest/str-multi-equity@0.9.0',
    registryId: 'STR-000070',
    createdAt: '2026-06-30T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    registeredAt: '2026-07-02T00:00:00.000Z',
    tags: ['equity', 'blend', 'market-neutral'],
    validation: {
      status: 'PASSED',
      checkedAt: '2026-07-18T00:00:00.000Z',
      issues: [
        {
          code: 'RISK-014',
          severity: 'WARNING',
          message: 'Concentration approaching single-name limit.',
        },
      ],
    },
    risk: [
      { key: 'gross', label: 'Gross exposure', value: '160%', limit: '200%', status: 'WITHIN' },
      {
        key: 'conc',
        label: 'Concentration',
        value: '4.6% / name',
        limit: '5% / name',
        status: 'ELEVATED',
      },
      { key: 'dd', label: 'Max drawdown (limit)', value: '—', limit: '12%', status: 'WITHIN' },
    ],
    composition: [
      { signalId: 'sig-reversal', name: 'Reversal signal', assetClass: 'EQUITY', weight: '60%' },
      {
        signalId: 'sig-rates-value',
        name: 'Rates value signal',
        assetClass: 'RATES',
        weight: '40%',
      },
    ],
    portfolioRefs: [],
    experimentRefs: [
      { id: 'exp-momentum-reversal', name: 'Short-horizon reversal in US equities' },
    ],
    versions: [
      { version: '0.9.0', registeredAt: '2026-07-02T00:00:00.000Z', note: 'Submitted for review.' },
    ],
    lineage: [
      { id: 'sig-reversal', label: 'Reversal signal', kind: 'signal' },
      { id: 'str-multi-equity', label: 'Multi-signal equity', kind: 'strategy' },
    ],
    workflow: {
      workflowRef: 'WFC-47',
      name: 'Risk review',
      state: 'RUNNING',
      currentStage: 'Risk review',
    },
    timeline: [
      { stage: 'registered', label: 'Strategy registered', occurredAt: '2026-07-02T00:00:00.000Z' },
      { stage: 'validation', label: 'Validation', occurredAt: '2026-07-18T00:00:00.000Z' },
      { stage: 'review', label: 'Risk review' },
      { stage: 'approved', label: 'Approved for portfolio' },
    ],
  },
  {
    id: 'str-credit-mom',
    slug: 'credit-momentum',
    name: 'Credit momentum',
    description: 'Advisory credit momentum strategy (retired after refuted research).',
    category: 'MOMENTUM',
    assetClass: 'CREDIT',
    owner: 'Portfolio Research',
    version: '1.0.0',
    status: 'RETIRED',
    approval: {
      state: 'REJECTED',
      submittedAt: '2026-05-01T00:00:00.000Z',
      decidedAt: '2026-06-30T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    portfolioEligibility: 'NOT_ELIGIBLE',
    provenanceComplete: true,
    registryId: 'STR-000012',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-06-30T00:00:00.000Z',
    registeredAt: '2026-02-03T00:00:00.000Z',
    tags: ['credit', 'momentum'],
    validation: {
      status: 'FAILED',
      checkedAt: '2026-06-28T00:00:00.000Z',
      issues: [
        {
          code: 'RET-002',
          severity: 'INFO',
          message: 'Retired after originating experiment refuted (SM-4).',
        },
      ],
    },
    risk: [
      { key: 'gross', label: 'Gross exposure', value: '—', limit: '150%', status: 'NOT_ASSESSED' },
    ],
    composition: [
      {
        signalId: 'sig-credit-mom',
        name: 'Credit momentum signal',
        assetClass: 'CREDIT',
        weight: '100%',
      },
    ],
    portfolioRefs: [],
    experimentRefs: [{ id: 'exp-credit-momentum', name: 'Cross-sectional credit momentum' }],
    versions: [
      { version: '1.0.0', registeredAt: '2026-02-03T00:00:00.000Z', note: 'Initial release.' },
    ],
    lineage: [
      { id: 'sig-credit-mom', label: 'Credit momentum signal', kind: 'signal' },
      { id: 'str-credit-mom', label: 'Credit momentum', kind: 'strategy' },
    ],
    workflow: {
      workflowRef: 'WFC-47',
      name: 'Risk review',
      state: 'COMPLETED',
      currentStage: 'Retired',
    },
    timeline: [
      { stage: 'registered', label: 'Strategy registered', occurredAt: '2026-02-03T00:00:00.000Z' },
      { stage: 'validation', label: 'Validation', occurredAt: '2026-06-28T00:00:00.000Z' },
      { stage: 'retired', label: 'Retired', occurredAt: '2026-06-30T00:00:00.000Z' },
    ],
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockStrategyRepository implements StrategyRepository {
  private readonly data: readonly StrategyDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly StrategyDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: StrategyQuery): Promise<readonly StrategyDto[]> {
    await this.delay();
    return applyStrategyQuery(this.data, query);
  }

  async getById(id: string): Promise<StrategyDto | null> {
    await this.delay();
    return this.data.find((strategy) => strategy.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const STRATEGY_SEED = SEED;
