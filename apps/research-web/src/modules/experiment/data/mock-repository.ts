/**
 * In-memory mock adapter for development. Synthetic METADATA ONLY — no execution,
 * no statistics, no persistence (all out of scope / forbidden here). Dataset
 * references use ids from the Dataset Module seed so cross-links resolve.
 */
import type { ExperimentDto } from '../domain/dto';
import { applyExperimentQuery, type ExperimentQuery } from '../domain/query';
import type { ExperimentRepository } from './repository';

const SEED: readonly ExperimentDto[] = [
  {
    id: 'exp-momentum-reversal',
    slug: 'short-horizon-reversal',
    title: 'Short-horizon reversal in US equities',
    researchQuestion:
      'Do 1–5 day returns reverse after idiosyncratic shocks in liquid US equities?',
    economicRationale:
      'Liquidity provision demands compensation; overreaction to shocks mean-reverts.',
    status: 'UNDER_VALIDATION',
    outcome: 'PENDING',
    owner: 'Quant Research',
    assetClass: 'EQUITY',
    universe: 'US large-cap',
    horizon: '1–5 days',
    version: '1.2.0',
    createdAt: '2026-05-02T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    registeredAt: '2026-05-05T00:00:00.000Z',
    tags: ['equity', 'reversal', 'short-horizon'],
    hypothesis: {
      statement: 'Idiosyncratic shocks are followed by partial reversal within one week.',
      prediction: 'Reversal portfolio earns positive net-of-cost return over the horizon.',
      successCriteria:
        'Deflated Sharpe > 0 after multiple-testing correction on the sealed holdout.',
      preRegistered: true,
      preRegisteredAt: '2026-05-05T00:00:00.000Z',
      frozen: true,
    },
    datasetRefs: [
      { id: 'ds-equity-eod', name: 'US Equity Prices (EOD)', version: '4.2.0' },
      { id: 'ds-corp-actions', name: 'Corporate Actions', version: '2.9.1' },
    ],
    featureRefs: [{ id: 'feat-resid-return', name: 'Residual return (1d)' }],
    workflow: {
      workflowRef: 'WFC-46',
      name: 'Validation',
      state: 'RUNNING',
      currentStage: 'Purged/embargoed CV',
    },
    validation: { status: 'PENDING', issues: [] },
    trialLedgerRef: 'TL-2026-0421',
    timeline: [
      { stage: 'idea', label: 'Idea registered', occurredAt: '2026-05-02T00:00:00.000Z' },
      {
        stage: 'hypothesis',
        label: 'Hypothesis pre-registered',
        occurredAt: '2026-05-05T00:00:00.000Z',
      },
      {
        stage: 'experiment',
        label: 'Experiment versioned',
        occurredAt: '2026-05-20T00:00:00.000Z',
      },
      { stage: 'validation', label: 'Validation gauntlet' },
      { stage: 'replication', label: 'Independent replication' },
      { stage: 'governance', label: 'Scientific governance' },
    ],
  },
  {
    id: 'exp-carry-fx',
    slug: 'fx-carry-crowding',
    title: 'FX carry with crowding adjustment',
    researchQuestion: 'Does adjusting carry signals for crowding improve net-of-cost performance?',
    economicRationale:
      'Crowded carry trades face unwind risk; de-crowding should improve robustness.',
    status: 'UNDER_REVIEW',
    outcome: 'PENDING',
    owner: 'Quant Research',
    assetClass: 'FX',
    universe: 'G10 FX',
    horizon: '1 month',
    version: '0.9.0',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    registeredAt: '2026-04-12T00:00:00.000Z',
    tags: ['fx', 'carry', 'crowding'],
    hypothesis: {
      statement: 'Crowding-adjusted carry outperforms naive carry net of costs.',
      prediction: 'Adjusted signal shows higher deflated Sharpe on the holdout.',
      successCriteria: 'Improvement significant after trial-count correction.',
      preRegistered: true,
      preRegisteredAt: '2026-04-12T00:00:00.000Z',
      frozen: true,
    },
    datasetRefs: [{ id: 'ds-fx-spot', name: 'FX Spot Rates', version: '1.4.0' }],
    featureRefs: [
      { id: 'feat-carry', name: 'Carry signal' },
      { id: 'feat-crowding', name: 'Crowding score' },
    ],
    workflow: {
      workflowRef: 'WFC-46',
      name: 'Validation',
      state: 'BLOCKED',
      currentStage: 'Awaiting reviewer',
    },
    validation: {
      status: 'FAILED',
      checkedAt: '2026-07-20T00:00:00.000Z',
      issues: [
        {
          code: 'MTC-002',
          severity: 'ERROR',
          message: 'Effect not significant after trial-count correction.',
        },
      ],
    },
    trialLedgerRef: 'TL-2026-0388',
    timeline: [
      { stage: 'idea', label: 'Idea registered', occurredAt: '2026-04-10T00:00:00.000Z' },
      {
        stage: 'hypothesis',
        label: 'Hypothesis pre-registered',
        occurredAt: '2026-04-12T00:00:00.000Z',
      },
      {
        stage: 'experiment',
        label: 'Experiment versioned',
        occurredAt: '2026-05-01T00:00:00.000Z',
      },
      { stage: 'validation', label: 'Validation gauntlet', occurredAt: '2026-07-20T00:00:00.000Z' },
      { stage: 'review', label: 'Scientific governance' },
    ],
  },
  {
    id: 'exp-credit-momentum',
    slug: 'credit-momentum',
    title: 'Cross-sectional credit momentum',
    researchQuestion: 'Is there exploitable momentum in credit spreads net of borrow costs?',
    economicRationale: 'Slow information diffusion across the credit universe.',
    status: 'CONCLUDED',
    outcome: 'REFUTED',
    owner: 'Quant Research',
    assetClass: 'CREDIT',
    universe: 'IG + HY',
    horizon: '3 months',
    version: '2.0.0',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-06-30T00:00:00.000Z',
    registeredAt: '2026-01-18T00:00:00.000Z',
    tags: ['credit', 'momentum'],
    hypothesis: {
      statement: 'Credit spread momentum persists over one quarter.',
      prediction: 'Momentum portfolio earns positive net return.',
      successCriteria: 'Deflated Sharpe > 0 on the holdout.',
      preRegistered: true,
      preRegisteredAt: '2026-01-18T00:00:00.000Z',
      frozen: true,
    },
    datasetRefs: [{ id: 'ds-credit-spreads', name: 'Credit Spreads', version: '0.9.0' }],
    featureRefs: [{ id: 'feat-spread-mom', name: 'Spread momentum (3m)' }],
    workflow: {
      workflowRef: 'WFC-46',
      name: 'Validation',
      state: 'COMPLETED',
      currentStage: 'Concluded',
    },
    validation: {
      status: 'PASSED',
      checkedAt: '2026-06-28T00:00:00.000Z',
      issues: [
        {
          code: 'NEG-001',
          severity: 'INFO',
          message: 'Negative result recorded and preserved (SM-4).',
        },
      ],
    },
    trialLedgerRef: 'TL-2026-0102',
    timeline: [
      { stage: 'idea', label: 'Idea registered', occurredAt: '2026-01-15T00:00:00.000Z' },
      {
        stage: 'hypothesis',
        label: 'Hypothesis pre-registered',
        occurredAt: '2026-01-18T00:00:00.000Z',
      },
      {
        stage: 'experiment',
        label: 'Experiment versioned',
        occurredAt: '2026-02-10T00:00:00.000Z',
      },
      { stage: 'validation', label: 'Validation gauntlet', occurredAt: '2026-06-28T00:00:00.000Z' },
      { stage: 'concluded', label: 'Concluded (refuted)', occurredAt: '2026-06-30T00:00:00.000Z' },
    ],
  },
  {
    id: 'exp-rates-value',
    slug: 'rates-value-curve',
    title: 'Curve value in government rates',
    researchQuestion: 'Do rich/cheap curve signals predict relative returns?',
    economicRationale: 'Segmented demand creates temporary curve dislocations.',
    status: 'RUNNING',
    outcome: 'PENDING',
    owner: 'Quant Research',
    assetClass: 'RATES',
    universe: 'G7 govies',
    horizon: '1 month',
    version: '0.4.0',
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    registeredAt: '2026-06-22T00:00:00.000Z',
    tags: ['rates', 'value'],
    hypothesis: {
      statement: 'Curve rich/cheap signals mean-revert within a month.',
      prediction: 'Value portfolio earns positive net return.',
      successCriteria: 'Deflated Sharpe > 0 on the holdout.',
      preRegistered: true,
      preRegisteredAt: '2026-06-22T00:00:00.000Z',
      frozen: true,
    },
    datasetRefs: [{ id: 'ds-rates-curves', name: 'Rates Curves', version: '3.0.0' }],
    featureRefs: [{ id: 'feat-curve-value', name: 'Curve value score' }],
    workflow: {
      workflowRef: 'WFC-43',
      name: 'Research discovery',
      state: 'RUNNING',
      currentStage: 'Experiment',
    },
    validation: { status: 'NOT_RUN', issues: [] },
    trialLedgerRef: 'TL-2026-0455',
    timeline: [
      { stage: 'idea', label: 'Idea registered', occurredAt: '2026-06-20T00:00:00.000Z' },
      {
        stage: 'hypothesis',
        label: 'Hypothesis pre-registered',
        occurredAt: '2026-06-22T00:00:00.000Z',
      },
      { stage: 'experiment', label: 'Experiment versioned' },
      { stage: 'validation', label: 'Validation gauntlet' },
    ],
  },
  {
    id: 'exp-vol-carry',
    slug: 'equity-vol-carry',
    title: 'Equity volatility carry',
    researchQuestion: 'Is the variance risk premium harvestable net of costs?',
    economicRationale: 'Investors pay for downside protection; sellers earn the premium.',
    status: 'DRAFT',
    outcome: 'PENDING',
    owner: 'Quant Research',
    assetClass: 'EQUITY',
    universe: 'US index options',
    horizon: '1 month',
    version: '0.1.0',
    createdAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    tags: ['equity', 'volatility', 'carry'],
    hypothesis: {
      statement: 'Selling variance earns a positive premium net of costs.',
      prediction: 'Short-variance portfolio earns positive net return.',
      successCriteria: 'To be finalised before pre-registration.',
      preRegistered: false,
      frozen: false,
    },
    datasetRefs: [],
    featureRefs: [],
    workflow: {
      workflowRef: 'WFC-43',
      name: 'Research discovery',
      state: 'NOT_STARTED',
      currentStage: 'Idea',
    },
    validation: { status: 'NOT_RUN', issues: [] },
    timeline: [{ stage: 'idea', label: 'Idea drafted' }],
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockExperimentRepository implements ExperimentRepository {
  private readonly data: readonly ExperimentDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly ExperimentDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: ExperimentQuery): Promise<readonly ExperimentDto[]> {
    await this.delay();
    return applyExperimentQuery(this.data, query);
  }

  async getById(id: string): Promise<ExperimentDto | null> {
    await this.delay();
    return this.data.find((experiment) => experiment.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const EXPERIMENT_SEED = SEED;
