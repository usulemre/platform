/**
 * In-memory mock adapter for development. Synthetic METADATA ONLY — no
 * optimization, no position sizing, no statistics, no persistence (all out of
 * scope / forbidden). Weights, holdings, constraint and risk statuses are
 * pre-supplied. Strategy/experiment references use ids from those modules' seeds.
 */
import type { PortfolioDto } from '../domain/dto';
import { applyPortfolioQuery, type PortfolioQuery } from '../domain/query';
import type { PortfolioRepository } from './repository';

const SEED: readonly PortfolioDto[] = [
  {
    id: 'port-core',
    slug: 'core-multi-strategy',
    name: 'Core multi-strategy',
    description: 'Advisory multi-strategy research portfolio (paper).',
    mandate: 'Multi-asset absolute return',
    assetClass: 'MULTI',
    owner: 'Portfolio Research',
    version: '2.0.0',
    baseCurrency: 'USD',
    asOf: '2026-07-25T00:00:00.000Z',
    status: 'APPROVED',
    approval: {
      state: 'APPROVED',
      submittedAt: '2026-06-15T00:00:00.000Z',
      decidedAt: '2026-06-28T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    deploymentMode: 'PAPER',
    provenanceComplete: true,
    manifestRef: 'manifest/port-core@2.0.0',
    registryId: 'PFR-000019',
    backtestRef: 'backtest/port-core@2.0.0',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    registeredAt: '2026-05-03T00:00:00.000Z',
    tags: ['multi-asset', 'core', 'paper'],
    validation: { status: 'PASSED', checkedAt: '2026-06-28T00:00:00.000Z', issues: [] },
    risk: [
      { key: 'gross', label: 'Gross exposure', value: '210%', limit: '250%', status: 'WITHIN' },
      { key: 'net', label: 'Net exposure', value: '18%', limit: '±30%', status: 'WITHIN' },
      { key: 'var', label: 'VaR (95%)', value: '1.4%', limit: '2.0%', status: 'WITHIN' },
      { key: 'dd', label: 'Max drawdown (limit)', value: '—', limit: '12%', status: 'WITHIN' },
    ],
    constraints: [
      {
        key: 'max-name',
        label: 'Max single name',
        limit: '3%',
        value: '2.6%',
        status: 'SATISFIED',
      },
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
    holdings: [
      {
        id: 'h1',
        instrument: 'US equity reversal basket',
        assetClass: 'EQUITY',
        side: 'LONG',
        weight: '35%',
      },
      {
        id: 'h2',
        instrument: 'US equity reversal hedge',
        assetClass: 'EQUITY',
        side: 'SHORT',
        weight: '-30%',
      },
      {
        id: 'h3',
        instrument: 'G10 FX carry basket',
        assetClass: 'FX',
        side: 'LONG',
        weight: '20%',
      },
      {
        id: 'h4',
        instrument: 'Cash & equivalents',
        assetClass: 'CASH',
        side: 'FLAT',
        weight: '15%',
      },
    ],
    allocations: [
      { key: 'equity', label: 'Equity', weight: '55%' },
      { key: 'fx', label: 'FX', weight: '20%' },
      { key: 'cash', label: 'Cash', weight: '25%' },
    ],
    composition: [
      {
        strategyId: 'str-reversal-ls',
        name: 'Reversal long/short',
        assetClass: 'EQUITY',
        weight: '55%',
      },
      { strategyId: 'str-fx-carry', name: 'FX carry', assetClass: 'FX', weight: '45%' },
    ],
    experimentRefs: [
      { id: 'exp-momentum-reversal', name: 'Short-horizon reversal in US equities' },
    ],
    versions: [
      {
        version: '2.0.0',
        registeredAt: '2026-07-01T00:00:00.000Z',
        note: 'Rebalanced; strategy weights updated.',
      },
      {
        version: '1.0.0',
        registeredAt: '2026-05-03T00:00:00.000Z',
        note: 'Initial approved snapshot.',
      },
    ],
    lineage: [
      { id: 'str-reversal-ls', label: 'Reversal long/short', kind: 'strategy' },
      { id: 'str-fx-carry', label: 'FX carry', kind: 'strategy' },
      { id: 'port-core', label: 'Core multi-strategy', kind: 'portfolio' },
    ],
    workflow: {
      workflowRef: 'WFC-48',
      name: 'Portfolio construction',
      state: 'COMPLETED',
      currentStage: 'Approved (paper)',
    },
  },
  {
    id: 'port-equity-mn',
    slug: 'equity-market-neutral',
    name: 'Equity market-neutral',
    description: 'Advisory market-neutral equity research portfolio (under review).',
    mandate: 'Equity market-neutral',
    assetClass: 'EQUITY',
    owner: 'Portfolio Research',
    version: '0.8.0',
    baseCurrency: 'USD',
    asOf: '2026-07-28T00:00:00.000Z',
    status: 'UNDER_REVIEW',
    approval: { state: 'PENDING', submittedAt: '2026-07-16T00:00:00.000Z' },
    deploymentMode: 'RESEARCH',
    provenanceComplete: true,
    manifestRef: 'manifest/port-equity-mn@0.8.0',
    registryId: 'PFR-000032',
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    registeredAt: '2026-06-30T00:00:00.000Z',
    tags: ['equity', 'market-neutral'],
    validation: {
      status: 'PASSED',
      checkedAt: '2026-07-18T00:00:00.000Z',
      issues: [
        { code: 'CON-021', severity: 'WARNING', message: 'Single-strategy weight near limit.' },
      ],
    },
    risk: [
      { key: 'gross', label: 'Gross exposure', value: '180%', limit: '200%', status: 'WITHIN' },
      { key: 'net', label: 'Net exposure', value: '2%', limit: '±10%', status: 'WITHIN' },
      { key: 'var', label: 'VaR (95%)', value: 'Not assessed', status: 'NOT_ASSESSED' },
    ],
    constraints: [
      { key: 'max-name', label: 'Max single name', limit: '2%', value: '1.9%', status: 'WARNING' },
      { key: 'beta', label: 'Market beta', limit: '±0.1', value: '0.04', status: 'SATISFIED' },
    ],
    holdings: [
      { id: 'h1', instrument: 'Long book', assetClass: 'EQUITY', side: 'LONG', weight: '90%' },
      { id: 'h2', instrument: 'Short book', assetClass: 'EQUITY', side: 'SHORT', weight: '-90%' },
      { id: 'h3', instrument: 'Cash', assetClass: 'CASH', side: 'FLAT', weight: '10%' },
    ],
    allocations: [
      { key: 'equity', label: 'Equity (gross)', weight: '180%' },
      { key: 'cash', label: 'Cash', weight: '10%' },
    ],
    composition: [
      {
        strategyId: 'str-multi-equity',
        name: 'Multi-signal equity',
        assetClass: 'EQUITY',
        weight: '100%',
      },
    ],
    experimentRefs: [
      { id: 'exp-momentum-reversal', name: 'Short-horizon reversal in US equities' },
    ],
    versions: [
      { version: '0.8.0', registeredAt: '2026-06-30T00:00:00.000Z', note: 'Submitted for review.' },
    ],
    lineage: [
      { id: 'str-multi-equity', label: 'Multi-signal equity', kind: 'strategy' },
      { id: 'port-equity-mn', label: 'Equity market-neutral', kind: 'portfolio' },
    ],
    workflow: {
      workflowRef: 'WFC-48',
      name: 'Portfolio construction',
      state: 'RUNNING',
      currentStage: 'Risk review',
    },
  },
  {
    id: 'port-credit',
    slug: 'credit-relative-value',
    name: 'Credit relative value',
    description: 'Advisory credit RV research portfolio (retired).',
    mandate: 'Credit relative value',
    assetClass: 'CREDIT',
    owner: 'Portfolio Research',
    version: '1.0.0',
    baseCurrency: 'USD',
    asOf: '2026-06-30T00:00:00.000Z',
    status: 'RETIRED',
    approval: {
      state: 'REJECTED',
      submittedAt: '2026-05-10T00:00:00.000Z',
      decidedAt: '2026-06-30T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    deploymentMode: 'RESEARCH',
    provenanceComplete: true,
    registryId: 'PFR-000008',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-06-30T00:00:00.000Z',
    registeredAt: '2026-03-03T00:00:00.000Z',
    tags: ['credit', 'relative-value'],
    validation: {
      status: 'FAILED',
      checkedAt: '2026-06-28T00:00:00.000Z',
      issues: [
        {
          code: 'RET-003',
          severity: 'INFO',
          message: 'Retired after underlying strategy refuted (SM-4).',
        },
      ],
    },
    risk: [
      { key: 'gross', label: 'Gross exposure', value: '—', limit: '150%', status: 'NOT_ASSESSED' },
    ],
    constraints: [
      {
        key: 'concentration',
        label: 'Issuer concentration',
        limit: '5%',
        value: '—',
        status: 'NOT_ASSESSED',
      },
    ],
    holdings: [],
    allocations: [{ key: 'credit', label: 'Credit', weight: '0%' }],
    composition: [
      {
        strategyId: 'str-credit-mom',
        name: 'Credit momentum',
        assetClass: 'CREDIT',
        weight: '100%',
      },
    ],
    experimentRefs: [{ id: 'exp-credit-momentum', name: 'Cross-sectional credit momentum' }],
    versions: [
      { version: '1.0.0', registeredAt: '2026-03-03T00:00:00.000Z', note: 'Initial snapshot.' },
    ],
    lineage: [
      { id: 'str-credit-mom', label: 'Credit momentum', kind: 'strategy' },
      { id: 'port-credit', label: 'Credit relative value', kind: 'portfolio' },
    ],
    workflow: {
      workflowRef: 'WFC-48',
      name: 'Portfolio construction',
      state: 'COMPLETED',
      currentStage: 'Retired',
    },
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockPortfolioRepository implements PortfolioRepository {
  private readonly data: readonly PortfolioDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly PortfolioDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: PortfolioQuery): Promise<readonly PortfolioDto[]> {
    await this.delay();
    return applyPortfolioQuery(this.data, query);
  }

  async getById(id: string): Promise<PortfolioDto | null> {
    await this.delay();
    return this.data.find((portfolio) => portfolio.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const PORTFOLIO_SEED = SEED;
