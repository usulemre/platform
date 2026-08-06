/**
 * In-memory mock adapter for the Signal Engine UI. Synthetic signal METADATA
 * ONLY — no alpha models, no signal calculations, no statistics, no ML, no
 * persistence. Feature/dataset/signal references use the other research-web
 * modules' ids so cross-links resolve. This is the UI's own mock, independent of
 * the service tier.
 */
import { stageOrder, type RegisteredSignal, type SignalFamily } from '@platform/signal-sdk';
import { applySignalQuery, type SignalQuery } from '../domain/query';
import type { SignalEngineRepository } from './repository';

const SIGNALS: readonly RegisteredSignal[] = [
  {
    id: 'SG-REVERSAL',
    slug: 'short-horizon-reversal',
    name: 'Short-horizon reversal',
    description: 'Mean-reversion signal on residualized one-day returns in liquid US equities.',
    namespace: 'equities',
    family: 'reversal',
    stage: 'PRODUCTION_CANDIDATE',
    version: '2.1.0',
    validation: {
      status: 'PASSED',
      method: 'Purged & embargoed CV',
      checkedAt: '2026-07-28T00:00:00.000Z',
      note: 'Cleared leakage harness.',
    },
    approval: 'APPROVED',
    promotion: {
      status: 'PROMOTED',
      target: 'strategy-composition',
      queuedAt: '2026-07-29T00:00:00.000Z',
      promotedAt: '2026-07-30T00:00:00.000Z',
    },
    owner: { owner: 'Ada Researcher', team: 'Equity Research', steward: 'Signal Guild' },
    definition: {
      entity: 'security',
      horizon: '1-5d',
      direction: 'LONG_SHORT',
      rationale: 'Liquidity-provision reversal after risk removal.',
      featureRefs: ['feat-resid-return'],
    },
    versions: [
      {
        version: '2.1.0',
        stage: 'PRODUCTION_CANDIDATE',
        createdAt: '2026-07-30T00:00:00.000Z',
        note: 'Promoted to production candidate.',
        manifestHash: 'sha256:51a1',
      },
      {
        version: '2.0.0',
        stage: 'REGISTRY',
        createdAt: '2026-06-01T00:00:00.000Z',
        note: 'Registered.',
        manifestHash: 'sha256:51a0',
      },
    ],
    dependencies: [
      {
        id: 'DEP-1',
        kind: 'FEATURE',
        ref: 'feat-resid-return',
        name: 'Residual return (1d)',
        status: 'SATISFIED',
      },
      {
        id: 'DEP-2',
        kind: 'DATASET',
        ref: 'ds-equity-eod',
        name: 'US Equity Prices (EOD)',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'DATASET', ref: 'ds-equity-eod', label: 'US Equity Prices (EOD)' },
        { id: 'N-2', kind: 'FEATURE', ref: 'feat-resid-return', label: 'Residual return (1d)' },
        { id: 'N-3', kind: 'SIGNAL', ref: 'sig-reversal', label: 'Short-horizon reversal' },
      ],
      edges: [
        { from: 'N-1', to: 'N-2' },
        { from: 'N-2', to: 'N-3' },
      ],
    },
    approvals: [
      {
        id: 'AP-1',
        role: 'Scientific Governance',
        status: 'APPROVED',
        decidedAt: '2026-07-29T00:00:00.000Z',
        rationale: 'Deflated Sharpe clears the budget.',
      },
    ],
    reviews: [
      {
        id: 'RV-1',
        reviewer: 'Validation',
        stage: 'REVIEW',
        status: 'PASSED',
        reviewedAt: '2026-07-27T00:00:00.000Z',
      },
    ],
    usage: {
      strategies: '2',
      backtests: '18',
      portfolios: '1',
      lastAccessedAt: '2026-08-01T00:00:00.000Z',
    },
    quality: {
      grade: 'PASS',
      coverage: 0.998,
      stability: 0.994,
      checkedAt: '2026-08-01T00:00:00.000Z',
    },
    health: { status: 'HEALTHY', message: 'Nominal.', lastRefreshedAt: '2026-08-02T00:00:00.000Z' },
    sync: {
      status: 'SYNCED',
      registryRef: 'REG-sig-reversal',
      lastSyncedAt: '2026-08-02T00:00:00.000Z',
    },
    tags: ['reversal', 'equity', 'advisory'],
    metadata: [
      { key: 'universe', value: 'US large-cap' },
      { key: 'pit', value: 'true' },
    ],
    registryRef: 'REG-sig-reversal',
    registeredAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
  },
  {
    id: 'SG-FX-CARRY',
    slug: 'fx-carry',
    name: 'FX carry',
    description: 'Crowding-adjusted carry signal for G10 FX awaiting promotion.',
    namespace: 'fx',
    family: 'carry',
    stage: 'REGISTRY',
    version: '1.2.0',
    validation: {
      status: 'PASSED',
      method: 'Purged & embargoed CV',
      checkedAt: '2026-07-25T00:00:00.000Z',
      note: 'Cleared.',
    },
    approval: 'APPROVED',
    promotion: {
      status: 'QUEUED',
      target: 'strategy-composition',
      queuedAt: '2026-07-31T00:00:00.000Z',
    },
    owner: { owner: 'Blaise Quant', team: 'Macro Research', steward: 'Signal Guild' },
    definition: {
      entity: 'currency_pair',
      horizon: '1-4w',
      direction: 'LONG_SHORT',
      rationale: 'Carry premium net of crowding penalty.',
      featureRefs: ['feat-carry'],
    },
    versions: [
      {
        version: '1.2.0',
        stage: 'REGISTRY',
        createdAt: '2026-07-22T00:00:00.000Z',
        note: 'Registered with crowding overlay.',
        manifestHash: 'sha256:c012',
      },
    ],
    dependencies: [
      { id: 'DEP-3', kind: 'FEATURE', ref: 'feat-carry', name: 'FX carry', status: 'SATISFIED' },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'DATASET', ref: 'ds-fx-spot', label: 'FX Spot Rates' },
        { id: 'N-2', kind: 'FEATURE', ref: 'feat-carry', label: 'FX carry' },
        { id: 'N-3', kind: 'SIGNAL', ref: 'sig-fx-carry', label: 'FX carry' },
      ],
      edges: [
        { from: 'N-1', to: 'N-2' },
        { from: 'N-2', to: 'N-3' },
      ],
    },
    approvals: [
      {
        id: 'AP-2',
        role: 'Scientific Governance',
        status: 'APPROVED',
        decidedAt: '2026-07-26T00:00:00.000Z',
      },
    ],
    reviews: [
      {
        id: 'RV-2',
        reviewer: 'Validation',
        stage: 'REVIEW',
        status: 'PASSED',
        reviewedAt: '2026-07-24T00:00:00.000Z',
      },
    ],
    usage: {
      strategies: '1',
      backtests: '7',
      portfolios: '0',
      lastAccessedAt: '2026-07-30T00:00:00.000Z',
    },
    quality: {
      grade: 'WARN',
      coverage: 0.972,
      stability: 0.981,
      checkedAt: '2026-07-30T00:00:00.000Z',
    },
    health: {
      status: 'STALE',
      message: 'Awaiting refresh.',
      lastRefreshedAt: '2026-07-25T00:00:00.000Z',
    },
    sync: {
      status: 'SYNCED',
      registryRef: 'REG-sig-fx-carry',
      lastSyncedAt: '2026-07-30T00:00:00.000Z',
    },
    tags: ['carry', 'fx', 'macro'],
    metadata: [{ key: 'universe', value: 'G10 FX' }],
    registryRef: 'REG-sig-fx-carry',
    registeredAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
  },
  {
    id: 'SG-RATES-VALUE',
    slug: 'rates-curve-value',
    name: 'Curve value',
    description: 'Government-rate curve value signal in approval review.',
    namespace: 'rates',
    family: 'value',
    stage: 'APPROVAL',
    version: '0.9.0',
    validation: {
      status: 'PASSED',
      method: 'Independent replication',
      checkedAt: '2026-07-18T00:00:00.000Z',
      note: 'Replication passed.',
    },
    approval: 'PENDING',
    promotion: { status: 'NOT_QUEUED', target: 'strategy-composition' },
    owner: { owner: 'Cleo Analyst', team: 'Rates Research', steward: 'Signal Guild' },
    definition: {
      entity: 'tenor',
      horizon: '1-3m',
      direction: 'MARKET_NEUTRAL',
      rationale: 'Curve value predicts rate returns.',
      featureRefs: ['feat-curve-value'],
    },
    versions: [
      {
        version: '0.9.0',
        stage: 'APPROVAL',
        createdAt: '2026-07-18T00:00:00.000Z',
        note: 'Submitted for approval.',
        manifestHash: 'sha256:9a09',
      },
    ],
    dependencies: [
      {
        id: 'DEP-4',
        kind: 'FEATURE',
        ref: 'feat-curve-value',
        name: 'Curve value',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'FEATURE', ref: 'feat-curve-value', label: 'Curve value' },
        { id: 'N-2', kind: 'SIGNAL', ref: 'sig-rates-value', label: 'Curve value' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    approvals: [{ id: 'AP-3', role: 'Scientific Governance', status: 'PENDING' }],
    reviews: [
      {
        id: 'RV-3',
        reviewer: 'Risk Oversight',
        stage: 'REVIEW',
        status: 'PASSED',
        reviewedAt: '2026-07-17T00:00:00.000Z',
      },
    ],
    usage: { strategies: '0', backtests: '5', portfolios: '0' },
    quality: {
      grade: 'PASS',
      coverage: 0.997,
      stability: 0.992,
      checkedAt: '2026-07-18T00:00:00.000Z',
    },
    health: {
      status: 'STALE',
      message: 'Pending approval.',
      lastRefreshedAt: '2026-07-18T00:00:00.000Z',
    },
    sync: { status: 'PENDING', registryRef: 'REG-sig-rates-value' },
    tags: ['rates', 'value', 'approval'],
    metadata: [{ key: 'universe', value: 'G7 rates' }],
    registryRef: 'REG-sig-rates-value',
    registeredAt: '2026-07-18T00:00:00.000Z',
    updatedAt: '2026-07-18T00:00:00.000Z',
  },
  {
    id: 'SG-CREDIT-MOM',
    slug: 'credit-momentum',
    name: 'Credit momentum',
    description: 'Spread-momentum signal in research, not yet validated.',
    namespace: 'credit',
    family: 'momentum',
    stage: 'RESEARCH',
    version: '0.2.0',
    validation: {
      status: 'PENDING',
      method: 'Purged & embargoed CV',
      note: 'Validation not yet run.',
    },
    approval: 'NOT_REQUESTED',
    promotion: { status: 'NOT_QUEUED', target: 'strategy-composition' },
    owner: { owner: 'Dara Researcher', team: 'Credit Research', steward: 'Signal Guild' },
    definition: {
      entity: 'issuer',
      horizon: '1-2m',
      direction: 'LONG_SHORT',
      rationale: 'Spread momentum persistence.',
      featureRefs: ['feat-spread-mom'],
    },
    versions: [
      {
        version: '0.2.0',
        stage: 'RESEARCH',
        createdAt: '2026-07-27T00:00:00.000Z',
        note: 'Research draft.',
        manifestHash: 'sha256:2a02',
      },
    ],
    dependencies: [
      {
        id: 'DEP-5',
        kind: 'FEATURE',
        ref: 'feat-spread-mom',
        name: 'Spread momentum',
        status: 'PENDING',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'FEATURE', ref: 'feat-spread-mom', label: 'Spread momentum' },
        { id: 'N-2', kind: 'SIGNAL', ref: 'sig-credit-mom', label: 'Credit momentum' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    approvals: [],
    reviews: [{ id: 'RV-4', reviewer: 'Validation', stage: 'RESEARCH', status: 'PENDING' }],
    usage: { strategies: '0', backtests: '1', portfolios: '0' },
    quality: {
      grade: 'WARN',
      coverage: 0.95,
      stability: 0.96,
      checkedAt: '2026-07-27T00:00:00.000Z',
    },
    health: {
      status: 'UNKNOWN',
      message: 'In research.',
      lastRefreshedAt: '2026-07-27T00:00:00.000Z',
    },
    sync: { status: 'PENDING', registryRef: 'REG-sig-credit-mom' },
    tags: ['credit', 'momentum', 'research'],
    metadata: [{ key: 'universe', value: 'IG credit' }],
    registryRef: 'REG-sig-credit-mom',
    registeredAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
  },
  {
    id: 'SG-SEASONAL',
    slug: 'commodity-seasonality',
    name: 'Commodity seasonality',
    description: 'Seasonality candidate blocked at validation for leakage risk.',
    namespace: 'commodity',
    family: 'seasonality',
    stage: 'VALIDATION',
    version: '0.4.0',
    validation: {
      status: 'FAILED',
      method: 'Leakage harness',
      checkedAt: '2026-07-19T00:00:00.000Z',
      note: 'Potential look-ahead in encoding.',
    },
    approval: 'NOT_REQUESTED',
    promotion: { status: 'BLOCKED', target: 'strategy-composition' },
    owner: { owner: 'Dara Researcher', team: 'Commodity Research', steward: 'Signal Guild' },
    definition: {
      entity: 'contract',
      horizon: '1-3m',
      direction: 'DIRECTIONAL',
      rationale: 'Seasonal patterns in agricultural futures.',
      featureRefs: ['feat-carry'],
    },
    versions: [
      {
        version: '0.4.0',
        stage: 'VALIDATION',
        createdAt: '2026-07-19T00:00:00.000Z',
        note: 'Blocked: leakage risk.',
        manifestHash: 'sha256:4a04',
      },
    ],
    dependencies: [
      {
        id: 'DEP-6',
        kind: 'DATASET',
        ref: 'ds-cme-es-index',
        name: 'CME ES index prices',
        status: 'MISSING',
      },
    ],
    lineage: {
      nodes: [{ id: 'N-1', kind: 'SIGNAL', ref: 'sig-seasonal', label: 'Commodity seasonality' }],
      edges: [],
    },
    approvals: [],
    reviews: [
      {
        id: 'RV-5',
        reviewer: 'Validation',
        stage: 'VALIDATION',
        status: 'CHANGES_REQUESTED',
        note: 'Address look-ahead before resubmitting.',
        reviewedAt: '2026-07-19T00:00:00.000Z',
      },
    ],
    usage: { strategies: '0', backtests: '2', portfolios: '0' },
    quality: {
      grade: 'FAIL',
      coverage: 0.88,
      stability: 0.9,
      checkedAt: '2026-07-19T00:00:00.000Z',
    },
    health: {
      status: 'DEGRADED',
      message: 'Blocked; leakage risk.',
      lastRefreshedAt: '2026-07-19T00:00:00.000Z',
    },
    sync: {
      status: 'ERROR',
      registryRef: 'REG-sig-seasonal',
      lastSyncedAt: '2026-07-05T00:00:00.000Z',
    },
    tags: ['seasonality', 'commodity', 'blocked'],
    metadata: [{ key: 'universe', value: 'Ags' }],
    registryRef: 'REG-sig-seasonal',
    registeredAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-07-19T00:00:00.000Z',
  },
];

const FAMILIES: readonly SignalFamily[] = [
  {
    namespace: 'equities',
    family: 'reversal',
    description: 'Short-horizon reversal signals.',
    signalCount: 1,
  },
  { namespace: 'fx', family: 'carry', description: 'FX carry signals.', signalCount: 1 },
  {
    namespace: 'rates',
    family: 'value',
    description: 'Government-rate value signals.',
    signalCount: 1,
  },
  {
    namespace: 'credit',
    family: 'momentum',
    description: 'Credit spread-momentum signals.',
    signalCount: 1,
  },
  {
    namespace: 'commodity',
    family: 'seasonality',
    description: 'Seasonality signals.',
    signalCount: 1,
  },
];

function isPromotable(signal: RegisteredSignal): boolean {
  return (
    signal.promotion.status === 'QUEUED' ||
    (stageOrder(signal.stage) >= stageOrder('REGISTRY') &&
      signal.approval === 'APPROVED' &&
      signal.validation.status === 'PASSED')
  );
}

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockSignalEngineRepository implements SignalEngineRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listSignals(query: SignalQuery): Promise<readonly RegisteredSignal[]> {
    await this.delay();
    return applySignalQuery(SIGNALS, query);
  }

  async getSignal(id: string): Promise<RegisteredSignal | null> {
    await this.delay();
    return SIGNALS.find((signal) => signal.id === id) ?? null;
  }

  async listFamilies(): Promise<readonly SignalFamily[]> {
    await this.delay();
    return FAMILIES;
  }

  async promotionQueue(): Promise<readonly RegisteredSignal[]> {
    await this.delay();
    return SIGNALS.filter(isPromotable);
  }

  async approvalQueue(): Promise<readonly RegisteredSignal[]> {
    await this.delay();
    return SIGNALS.filter((signal) =>
      signal.approvals.some((approval) => approval.status === 'PENDING'),
    );
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const SIGNAL_ENGINE_SEED = { signals: SIGNALS, families: FAMILIES } as const;
