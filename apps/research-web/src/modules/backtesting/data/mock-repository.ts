/**
 * In-memory mock adapter for the Backtesting Engine UI. Synthetic backtest
 * METADATA ONLY — no simulation, no performance-metric computation, no
 * optimization, no persistence. Dataset/feature/signal/strategy/experiment/
 * portfolio references use the other research-web modules' ids so cross-links
 * resolve; metric VALUES are inert strings. This is the UI's own mock, independent
 * of the service tier.
 */
import {
  isActiveRun,
  type Backtest,
  type BacktestComparison,
  type BacktestFamily,
} from '@platform/backtesting-sdk';
import { applyBacktestQuery, type BacktestQuery } from '../domain/query';
import type { BacktestingRepository } from './repository';

const BACKTESTS: readonly Backtest[] = [
  {
    id: 'BT-REVERSAL',
    slug: 'reversal-ls-historical',
    name: 'Reversal L/S historical',
    description: 'Historical simulation of the short-horizon reversal strategy in US equities.',
    namespace: 'equities',
    family: 'reversal',
    stage: 'APPROVED',
    version: '2.0.0',
    configuration: {
      scenario: {
        id: 'SC-1',
        kind: 'HISTORICAL',
        label: 'Historical 2015–2025',
        window: '2015-01-01 → 2025-12-31',
        description: 'Full-history point-in-time replay.',
      },
      universe: 'US large-cap',
      startDate: '2015-01-01',
      endDate: '2025-12-31',
      frequency: 'daily',
      costModel: 'participation-aware',
      parameterSets: [
        {
          id: 'PS-1',
          name: 'Baseline',
          params: [
            { key: 'lookback', value: '5d' },
            { key: 'holding', value: '3d' },
          ],
        },
      ],
      notes: 'Net-of-cost from first screen.',
    },
    run: {
      id: 'RUN-3',
      status: 'COMPLETED',
      attempt: 1,
      progress: 100,
      startedAt: '2026-07-20T00:00:00.000Z',
      endedAt: '2026-07-20T04:00:00.000Z',
      note: 'Completed nominally.',
    },
    runs: [
      {
        id: 'RUN-3',
        status: 'COMPLETED',
        attempt: 1,
        progress: 100,
        startedAt: '2026-07-20T00:00:00.000Z',
        endedAt: '2026-07-20T04:00:00.000Z',
        note: 'Completed nominally.',
      },
    ],
    sessions: [
      {
        id: 'SES-1',
        author: 'Ada Researcher',
        summary: 'Configured baseline scenario.',
        startedAt: '2026-07-19T00:00:00.000Z',
        endedAt: '2026-07-19T01:00:00.000Z',
      },
    ],
    results: [
      {
        id: 'RES-1',
        runId: 'RUN-3',
        parameterSetId: 'PS-1',
        summary: 'Baseline result set.',
        metrics: [
          { key: 'total_return', value: '84.2%' },
          { key: 'annualized_return', value: '9.1%' },
          { key: 'sharpe', value: '1.32' },
          { key: 'max_drawdown', value: '-12.4%' },
        ],
      },
    ],
    reports: [
      {
        id: 'REP-1',
        title: 'Reversal backtest report',
        ref: 'rep-reversal-2015-2025',
        generatedAt: '2026-07-20T05:00:00.000Z',
        summary: 'Attribution and capacity assessment.',
      },
    ],
    metrics: [
      { key: 'total_return', value: '84.2%' },
      { key: 'annualized_return', value: '9.1%' },
      { key: 'sharpe', value: '1.32' },
      { key: 'sortino', value: '1.81' },
      { key: 'max_drawdown', value: '-12.4%' },
      { key: 'volatility', value: '8.7%' },
      { key: 'hit_rate', value: '54%' },
      { key: 'turnover', value: '6.2x' },
    ],
    validation: {
      status: 'PASSED',
      method: 'Point-in-time + leakage harness',
      checkedAt: '2026-07-19T12:00:00.000Z',
      note: 'PIT verified; no look-ahead.',
    },
    approval: 'APPROVED',
    reviews: [
      {
        id: 'BRV-1',
        reviewer: 'Validation',
        stage: 'REVIEW',
        status: 'PASSED',
        reviewedAt: '2026-07-21T00:00:00.000Z',
      },
    ],
    approvals: [
      {
        id: 'BAP-1',
        role: 'Scientific Governance',
        status: 'APPROVED',
        decidedAt: '2026-07-22T00:00:00.000Z',
        rationale: 'Deflated metrics clear the budget.',
      },
    ],
    dependencies: [
      {
        id: 'BDEP-1',
        kind: 'DATASET',
        ref: 'ds-equity-eod',
        name: 'US Equity Prices (EOD)',
        status: 'SATISFIED',
      },
      {
        id: 'BDEP-2',
        kind: 'SIGNAL',
        ref: 'sig-reversal',
        name: 'Short-horizon reversal',
        status: 'SATISFIED',
      },
      {
        id: 'BDEP-3',
        kind: 'STRATEGY',
        ref: 'str-reversal-ls',
        name: 'Reversal L/S strategy',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'DATASET', ref: 'ds-equity-eod', label: 'US Equity Prices (EOD)' },
        { id: 'N-2', kind: 'SIGNAL', ref: 'sig-reversal', label: 'Short-horizon reversal' },
        { id: 'N-3', kind: 'STRATEGY', ref: 'str-reversal-ls', label: 'Reversal L/S strategy' },
        { id: 'N-4', kind: 'BACKTEST', ref: 'bt-reversal', label: 'Reversal L/S historical' },
      ],
      edges: [
        { from: 'N-1', to: 'N-2' },
        { from: 'N-2', to: 'N-3' },
        { from: 'N-3', to: 'N-4' },
      ],
    },
    artifacts: [
      { id: 'ART-1', kind: 'REPORT', ref: 'rep-reversal-2015-2025', name: 'Backtest report' },
      { id: 'ART-2', kind: 'EQUITY_CURVE', ref: 'eq-reversal', name: 'Equity curve' },
      { id: 'ART-3', kind: 'MANIFEST', ref: 'man-reversal-2', name: 'Run manifest' },
    ],
    versions: [
      {
        version: '2.0.0',
        stage: 'APPROVED',
        createdAt: '2026-07-22T00:00:00.000Z',
        note: 'Approved.',
        manifestHash: 'sha256:bt20',
      },
      {
        version: '1.0.0',
        stage: 'COMPLETED',
        createdAt: '2026-06-01T00:00:00.000Z',
        note: 'First run.',
        manifestHash: 'sha256:bt10',
      },
    ],
    owner: { owner: 'Ada Researcher', team: 'Equity Research', steward: 'Backtest Guild' },
    tags: ['reversal', 'equity', 'historical'],
    metadata: [
      { key: 'universe', value: 'US large-cap' },
      { key: 'pit', value: 'true' },
    ],
    experimentRef: 'exp-momentum-reversal',
    portfolioRef: 'port-equity-mn',
    registryRef: 'REG-bt-reversal',
    registeredAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
  },
  {
    id: 'BT-CARRY-WF',
    slug: 'fx-carry-walk-forward',
    name: 'FX carry walk-forward',
    description: 'Walk-forward analysis of the FX carry strategy awaiting review.',
    namespace: 'fx',
    family: 'carry',
    stage: 'REVIEW',
    version: '1.1.0',
    configuration: {
      scenario: {
        id: 'SC-2',
        kind: 'WALK_FORWARD',
        label: 'Walk-forward 12/3',
        window: '2018 → 2025',
        description: '12-month train / 3-month test rolling.',
      },
      universe: 'G10 FX',
      startDate: '2018-01-01',
      endDate: '2025-12-31',
      frequency: 'daily',
      costModel: 'spread + impact',
      parameterSets: [
        { id: 'PS-2', name: 'Crowding on', params: [{ key: 'crowding', value: 'on' }] },
        { id: 'PS-3', name: 'Crowding off', params: [{ key: 'crowding', value: 'off' }] },
      ],
      notes: 'Two parameter sets compared out-of-sample.',
    },
    run: {
      id: 'RUN-7',
      status: 'COMPLETED',
      attempt: 2,
      progress: 100,
      startedAt: '2026-07-28T00:00:00.000Z',
      endedAt: '2026-07-28T06:00:00.000Z',
      note: 'Retried after data gap fix.',
    },
    runs: [
      {
        id: 'RUN-6',
        status: 'FAILED',
        attempt: 1,
        progress: 62,
        startedAt: '2026-07-27T00:00:00.000Z',
        endedAt: '2026-07-27T02:00:00.000Z',
        note: 'Data gap in 2020.',
      },
      {
        id: 'RUN-7',
        status: 'COMPLETED',
        attempt: 2,
        progress: 100,
        startedAt: '2026-07-28T00:00:00.000Z',
        endedAt: '2026-07-28T06:00:00.000Z',
        note: 'Retried after data gap fix.',
      },
    ],
    sessions: [
      {
        id: 'SES-2',
        author: 'Blaise Quant',
        summary: 'Analyzed walk-forward folds.',
        startedAt: '2026-07-29T00:00:00.000Z',
      },
    ],
    results: [
      {
        id: 'RES-2',
        runId: 'RUN-7',
        parameterSetId: 'PS-2',
        summary: 'Crowding-on result set.',
        metrics: [
          { key: 'total_return', value: '41.0%' },
          { key: 'sharpe', value: '0.98' },
          { key: 'max_drawdown', value: '-9.8%' },
        ],
      },
    ],
    reports: [
      {
        id: 'REP-2',
        title: 'Carry walk-forward report',
        ref: 'rep-carry-wf',
        generatedAt: '2026-07-28T07:00:00.000Z',
        summary: 'Fold-by-fold out-of-sample summary.',
      },
    ],
    metrics: [
      { key: 'total_return', value: '41.0%' },
      { key: 'annualized_return', value: '5.2%' },
      { key: 'sharpe', value: '0.98' },
      { key: 'sortino', value: '1.24' },
      { key: 'max_drawdown', value: '-9.8%' },
      { key: 'volatility', value: '6.1%' },
      { key: 'hit_rate', value: '52%' },
      { key: 'turnover', value: '3.4x' },
    ],
    validation: {
      status: 'PASSED',
      method: 'Purged & embargoed CV',
      checkedAt: '2026-07-28T06:30:00.000Z',
      note: 'Embargo applied across folds.',
    },
    approval: 'NOT_REQUESTED',
    reviews: [{ id: 'BRV-2', reviewer: 'Validation', stage: 'REVIEW', status: 'PENDING' }],
    approvals: [],
    dependencies: [
      {
        id: 'BDEP-4',
        kind: 'DATASET',
        ref: 'ds-fx-spot',
        name: 'FX Spot Rates',
        status: 'SATISFIED',
      },
      { id: 'BDEP-5', kind: 'SIGNAL', ref: 'sig-fx-carry', name: 'FX carry', status: 'SATISFIED' },
      {
        id: 'BDEP-6',
        kind: 'STRATEGY',
        ref: 'str-fx-carry',
        name: 'FX carry strategy',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'DATASET', ref: 'ds-fx-spot', label: 'FX Spot Rates' },
        { id: 'N-2', kind: 'SIGNAL', ref: 'sig-fx-carry', label: 'FX carry' },
        { id: 'N-3', kind: 'STRATEGY', ref: 'str-fx-carry', label: 'FX carry strategy' },
        { id: 'N-4', kind: 'BACKTEST', ref: 'bt-carry-wf', label: 'FX carry walk-forward' },
      ],
      edges: [
        { from: 'N-1', to: 'N-2' },
        { from: 'N-2', to: 'N-3' },
        { from: 'N-3', to: 'N-4' },
      ],
    },
    artifacts: [
      { id: 'ART-4', kind: 'REPORT', ref: 'rep-carry-wf', name: 'Walk-forward report' },
      { id: 'ART-5', kind: 'ATTRIBUTION', ref: 'attr-carry', name: 'Attribution' },
    ],
    versions: [
      {
        version: '1.1.0',
        stage: 'REVIEW',
        createdAt: '2026-07-28T07:00:00.000Z',
        note: 'Under review.',
        manifestHash: 'sha256:btc11',
      },
    ],
    owner: { owner: 'Blaise Quant', team: 'Macro Research', steward: 'Backtest Guild' },
    tags: ['carry', 'fx', 'walk-forward'],
    metadata: [{ key: 'universe', value: 'G10 FX' }],
    experimentRef: 'exp-carry-fx',
    portfolioRef: 'port-core',
    registryRef: 'REG-bt-carry-wf',
    registeredAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
  },
  {
    id: 'BT-RATES-ROLL',
    slug: 'rates-value-rolling',
    name: 'Rates value rolling',
    description: 'Rolling-window backtest of the rates value strategy, currently running.',
    namespace: 'rates',
    family: 'value',
    stage: 'RUNNING',
    version: '0.5.0',
    configuration: {
      scenario: {
        id: 'SC-3',
        kind: 'ROLLING_WINDOW',
        label: 'Rolling 24m',
        window: '2016 → 2025',
        description: '24-month rolling recalibration.',
      },
      universe: 'G7 rates',
      startDate: '2016-01-01',
      endDate: '2025-12-31',
      frequency: 'daily',
      costModel: 'linear',
      parameterSets: [{ id: 'PS-4', name: 'Baseline', params: [{ key: 'window', value: '24m' }] }],
      notes: 'In-flight run.',
    },
    run: {
      id: 'RUN-9',
      status: 'RUNNING',
      attempt: 1,
      progress: 47,
      startedAt: '2026-08-02T00:00:00.000Z',
      note: 'Simulation in progress.',
    },
    runs: [
      {
        id: 'RUN-9',
        status: 'RUNNING',
        attempt: 1,
        progress: 47,
        startedAt: '2026-08-02T00:00:00.000Z',
        note: 'Simulation in progress.',
      },
    ],
    sessions: [
      {
        id: 'SES-3',
        author: 'Cleo Analyst',
        summary: 'Kicked off rolling run.',
        startedAt: '2026-08-02T00:00:00.000Z',
      },
    ],
    results: [],
    reports: [],
    metrics: [],
    validation: {
      status: 'PASSED',
      method: 'Point-in-time',
      checkedAt: '2026-08-01T00:00:00.000Z',
      note: 'PIT verified.',
    },
    approval: 'NOT_REQUESTED',
    reviews: [],
    approvals: [],
    dependencies: [
      {
        id: 'BDEP-7',
        kind: 'FEATURE',
        ref: 'feat-curve-value',
        name: 'Curve value',
        status: 'SATISFIED',
      },
      {
        id: 'BDEP-8',
        kind: 'STRATEGY',
        ref: 'str-credit-mom',
        name: 'Rates value strategy',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'FEATURE', ref: 'feat-curve-value', label: 'Curve value' },
        { id: 'N-2', kind: 'BACKTEST', ref: 'bt-rates-roll', label: 'Rates value rolling' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    artifacts: [{ id: 'ART-6', kind: 'MANIFEST', ref: 'man-rates', name: 'Run manifest' }],
    versions: [
      {
        version: '0.5.0',
        stage: 'RUNNING',
        createdAt: '2026-08-02T00:00:00.000Z',
        note: 'Running.',
        manifestHash: 'sha256:btr05',
      },
    ],
    owner: { owner: 'Cleo Analyst', team: 'Rates Research', steward: 'Backtest Guild' },
    tags: ['rates', 'value', 'rolling'],
    metadata: [{ key: 'universe', value: 'G7 rates' }],
    experimentRef: 'exp-rates-value',
    registryRef: 'REG-bt-rates-roll',
    registeredAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'BT-CREDIT-DRAFT',
    slug: 'credit-momentum-draft',
    name: 'Credit momentum draft',
    description: 'Draft backtest configuration for the credit momentum strategy.',
    namespace: 'credit',
    family: 'momentum',
    stage: 'CONFIGURATION',
    version: '0.1.0',
    configuration: {
      scenario: {
        id: 'SC-4',
        kind: 'HISTORICAL',
        label: 'Historical 2019–2025',
        window: '2019 → 2025',
        description: 'Draft window.',
      },
      universe: 'IG credit',
      startDate: '2019-01-01',
      endDate: '2025-12-31',
      frequency: 'daily',
      costModel: 'linear',
      parameterSets: [],
      notes: 'Awaiting parameter sets.',
    },
    run: { id: 'RUN-0', status: 'QUEUED', attempt: 0, progress: 0, note: 'Not yet started.' },
    runs: [],
    sessions: [
      {
        id: 'SES-4',
        author: 'Dara Researcher',
        summary: 'Drafting configuration.',
        startedAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    results: [],
    reports: [],
    metrics: [],
    validation: { status: 'NOT_RUN', method: 'Point-in-time', note: 'Validation not yet run.' },
    approval: 'NOT_REQUESTED',
    reviews: [],
    approvals: [],
    dependencies: [
      {
        id: 'BDEP-9',
        kind: 'FEATURE',
        ref: 'feat-spread-mom',
        name: 'Spread momentum',
        status: 'PENDING',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'FEATURE', ref: 'feat-spread-mom', label: 'Spread momentum' },
        { id: 'N-2', kind: 'BACKTEST', ref: 'bt-credit-draft', label: 'Credit momentum draft' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    artifacts: [],
    versions: [
      {
        version: '0.1.0',
        stage: 'CONFIGURATION',
        createdAt: '2026-08-01T00:00:00.000Z',
        note: 'Draft.',
        manifestHash: 'sha256:btcd01',
      },
    ],
    owner: { owner: 'Dara Researcher', team: 'Credit Research', steward: 'Backtest Guild' },
    tags: ['credit', 'momentum', 'draft'],
    metadata: [{ key: 'universe', value: 'IG credit' }],
    experimentRef: 'exp-credit-momentum',
    registryRef: 'REG-bt-credit-draft',
    registeredAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'BT-VOL-CANCELLED',
    slug: 'vol-carry-cancelled',
    name: 'Vol carry (cancelled)',
    description: 'Volatility carry backtest cancelled mid-run for a data issue.',
    namespace: 'equities',
    family: 'volatility',
    stage: 'QUEUED',
    version: '0.3.0',
    configuration: {
      scenario: {
        id: 'SC-5',
        kind: 'HISTORICAL',
        label: 'Historical 2017–2025',
        window: '2017 → 2025',
        description: 'Cancelled.',
      },
      universe: 'US options',
      startDate: '2017-01-01',
      endDate: '2025-12-31',
      frequency: 'daily',
      costModel: 'impact',
      parameterSets: [{ id: 'PS-5', name: 'Baseline', params: [{ key: 'tenor', value: '30d' }] }],
      notes: 'Cancelled; awaiting data fix and retry.',
    },
    run: {
      id: 'RUN-5',
      status: 'CANCELLED',
      attempt: 1,
      progress: 18,
      startedAt: '2026-07-26T00:00:00.000Z',
      endedAt: '2026-07-26T00:30:00.000Z',
      note: 'Cancelled by researcher (data issue).',
    },
    runs: [
      {
        id: 'RUN-5',
        status: 'CANCELLED',
        attempt: 1,
        progress: 18,
        startedAt: '2026-07-26T00:00:00.000Z',
        endedAt: '2026-07-26T00:30:00.000Z',
        note: 'Cancelled by researcher (data issue).',
      },
    ],
    sessions: [
      {
        id: 'SES-5',
        author: 'Dara Researcher',
        summary: 'Investigating vol surface gap.',
        startedAt: '2026-07-26T01:00:00.000Z',
      },
    ],
    results: [],
    reports: [],
    metrics: [],
    validation: { status: 'PENDING', method: 'Point-in-time', note: 'Pending data fix.' },
    approval: 'NOT_REQUESTED',
    reviews: [],
    approvals: [],
    dependencies: [
      {
        id: 'BDEP-10',
        kind: 'DATASET',
        ref: 'ds-cme-es-index',
        name: 'CME ES index prices',
        status: 'MISSING',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'BACKTEST', ref: 'bt-vol-cancelled', label: 'Vol carry (cancelled)' },
      ],
      edges: [],
    },
    artifacts: [],
    versions: [
      {
        version: '0.3.0',
        stage: 'QUEUED',
        createdAt: '2026-07-26T00:00:00.000Z',
        note: 'Queued after cancel.',
        manifestHash: 'sha256:btv03',
      },
    ],
    owner: { owner: 'Dara Researcher', team: 'Volatility Research', steward: 'Backtest Guild' },
    tags: ['volatility', 'carry', 'cancelled'],
    metadata: [{ key: 'universe', value: 'US options' }],
    experimentRef: 'exp-vol-carry',
    registryRef: 'REG-bt-vol-cancelled',
    registeredAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-26T00:30:00.000Z',
  },
];

const FAMILIES: readonly BacktestFamily[] = [
  {
    namespace: 'equities',
    family: 'reversal',
    description: 'Reversal strategy backtests.',
    backtestCount: 1,
  },
  {
    namespace: 'equities',
    family: 'volatility',
    description: 'Volatility strategy backtests.',
    backtestCount: 1,
  },
  { namespace: 'fx', family: 'carry', description: 'FX carry backtests.', backtestCount: 1 },
  { namespace: 'rates', family: 'value', description: 'Rates value backtests.', backtestCount: 1 },
  {
    namespace: 'credit',
    family: 'momentum',
    description: 'Credit momentum backtests.',
    backtestCount: 1,
  },
];

const COMPARISONS: readonly BacktestComparison[] = [
  {
    id: 'CMP-1',
    name: 'Reversal vs carry (risk-adjusted)',
    backtestIds: ['BT-REVERSAL', 'BT-CARRY-WF'],
    metricKeys: ['total_return', 'sharpe', 'max_drawdown', 'turnover'],
    createdAt: '2026-07-29T00:00:00.000Z',
    note: 'Head-to-head of the two completed backtests.',
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockBacktestingRepository implements BacktestingRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listBacktests(query: BacktestQuery): Promise<readonly Backtest[]> {
    await this.delay();
    return applyBacktestQuery(BACKTESTS, query);
  }

  async getBacktest(id: string): Promise<Backtest | null> {
    await this.delay();
    return BACKTESTS.find((backtest) => backtest.id === id) ?? null;
  }

  async listFamilies(): Promise<readonly BacktestFamily[]> {
    await this.delay();
    return FAMILIES;
  }

  async executionQueue(): Promise<readonly Backtest[]> {
    await this.delay();
    return BACKTESTS.filter((backtest) => isActiveRun(backtest.run.status));
  }

  async approvalQueue(): Promise<readonly Backtest[]> {
    await this.delay();
    return BACKTESTS.filter((backtest) =>
      backtest.approvals.some((approval) => approval.status === 'PENDING'),
    );
  }

  async listComparisons(): Promise<readonly BacktestComparison[]> {
    await this.delay();
    return COMPARISONS;
  }

  async getComparison(id: string): Promise<BacktestComparison | null> {
    await this.delay();
    return COMPARISONS.find((comparison) => comparison.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const BACKTESTING_SEED = {
  backtests: BACKTESTS,
  families: FAMILIES,
  comparisons: COMPARISONS,
} as const;
