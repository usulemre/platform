/**
 * In-memory mock adapter for development. Synthetic METADATA ONLY — no feature
 * computation, no statistics, no persistence (all out of scope / forbidden).
 * Dataset/experiment references use ids from those modules' seeds so cross-links
 * resolve.
 */
import type { FeatureDto } from '../domain/dto';
import { applyFeatureQuery, type FeatureQuery } from '../domain/query';
import type { FeatureRepository } from './repository';

const SEED: readonly FeatureDto[] = [
  {
    id: 'feat-resid-return',
    slug: 'residual-return-1d',
    name: 'Residual return (1d)',
    description: 'One-day return orthogonalised to market and sector factors.',
    category: 'REVERSAL',
    assetClass: 'EQUITY',
    valueType: 'CONTINUOUS',
    owner: 'Quant Research',
    version: '2.1.0',
    status: 'APPROVED',
    approval: {
      state: 'APPROVED',
      submittedAt: '2026-05-10T00:00:00.000Z',
      decidedAt: '2026-05-18T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    leakageHarness: 'PASSED',
    provenanceComplete: true,
    manifestRef: 'manifest/feat-resid-return@2.1.0',
    registryId: 'FRG-000112',
    createdAt: '2026-04-20T00:00:00.000Z',
    updatedAt: '2026-07-26T00:00:00.000Z',
    registeredAt: '2026-04-22T00:00:00.000Z',
    tags: ['equity', 'reversal', 'residual'],
    validation: { status: 'PASSED', checkedAt: '2026-05-18T00:00:00.000Z', issues: [] },
    dependsOn: [{ id: 'feat-market-beta', name: 'Market beta' }],
    datasetRefs: [
      { id: 'ds-equity-eod', name: 'US Equity Prices (EOD)', version: '4.2.0' },
      { id: 'ds-corp-actions', name: 'Corporate Actions', version: '2.9.1' },
    ],
    usage: {
      experiments: [{ id: 'exp-momentum-reversal', name: 'Short-horizon reversal in US equities' }],
      signals: [{ id: 'sig-reversal', name: 'Reversal signal' }],
    },
    versions: [
      {
        version: '2.1.0',
        registeredAt: '2026-07-01T00:00:00.000Z',
        note: 'Sector neutralisation refined.',
      },
      {
        version: '2.0.0',
        registeredAt: '2026-04-22T00:00:00.000Z',
        note: 'Initial approved release.',
      },
    ],
    lineage: [
      { id: 'ds-equity-eod', label: 'US Equity Prices (EOD)', kind: 'dataset' },
      { id: 'feat-market-beta', label: 'Market beta', kind: 'feature' },
      { id: 'feat-resid-return', label: 'Residual return (1d)', kind: 'feature' },
    ],
    workflow: {
      workflowRef: 'WFC-44',
      name: 'Feature research',
      state: 'COMPLETED',
      currentStage: 'Approved',
    },
  },
  {
    id: 'feat-market-beta',
    slug: 'market-beta',
    name: 'Market beta',
    description: 'Rolling beta of an asset to its market factor.',
    category: 'RISK',
    assetClass: 'EQUITY',
    valueType: 'CONTINUOUS',
    owner: 'Quant Research',
    version: '1.5.0',
    status: 'APPROVED',
    approval: {
      state: 'APPROVED',
      submittedAt: '2026-03-01T00:00:00.000Z',
      decidedAt: '2026-03-09T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    leakageHarness: 'PASSED',
    provenanceComplete: true,
    manifestRef: 'manifest/feat-market-beta@1.5.0',
    registryId: 'FRG-000041',
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
    registeredAt: '2026-02-12T00:00:00.000Z',
    tags: ['equity', 'risk', 'beta'],
    validation: { status: 'PASSED', checkedAt: '2026-03-09T00:00:00.000Z', issues: [] },
    dependsOn: [],
    datasetRefs: [{ id: 'ds-equity-eod', name: 'US Equity Prices (EOD)', version: '4.2.0' }],
    usage: {
      experiments: [{ id: 'exp-momentum-reversal', name: 'Short-horizon reversal in US equities' }],
      signals: [],
    },
    versions: [
      { version: '1.5.0', registeredAt: '2026-02-12T00:00:00.000Z', note: 'Initial release.' },
    ],
    lineage: [
      { id: 'ds-equity-eod', label: 'US Equity Prices (EOD)', kind: 'dataset' },
      { id: 'feat-market-beta', label: 'Market beta', kind: 'feature' },
    ],
    workflow: {
      workflowRef: 'WFC-44',
      name: 'Feature research',
      state: 'COMPLETED',
      currentStage: 'Approved',
    },
  },
  {
    id: 'feat-carry',
    slug: 'fx-carry-signal',
    name: 'Carry signal',
    description: 'Interest-rate differential carry signal for FX pairs.',
    category: 'CARRY',
    assetClass: 'FX',
    valueType: 'CONTINUOUS',
    owner: 'Quant Research',
    version: '0.9.0',
    status: 'UNDER_VALIDATION',
    approval: { state: 'PENDING', submittedAt: '2026-07-05T00:00:00.000Z' },
    leakageHarness: 'PASSED',
    provenanceComplete: true,
    manifestRef: 'manifest/feat-carry@0.9.0',
    registryId: 'FRG-000203',
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    registeredAt: '2026-06-18T00:00:00.000Z',
    tags: ['fx', 'carry'],
    validation: { status: 'PENDING', issues: [] },
    dependsOn: [],
    datasetRefs: [{ id: 'ds-fx-spot', name: 'FX Spot Rates', version: '1.4.0' }],
    usage: {
      experiments: [{ id: 'exp-carry-fx', name: 'FX carry with crowding adjustment' }],
      signals: [],
    },
    versions: [
      {
        version: '0.9.0',
        registeredAt: '2026-06-18T00:00:00.000Z',
        note: 'Submitted for validation.',
      },
    ],
    lineage: [
      { id: 'ds-fx-spot', label: 'FX Spot Rates', kind: 'dataset' },
      { id: 'feat-carry', label: 'Carry signal', kind: 'feature' },
    ],
    workflow: {
      workflowRef: 'WFC-44',
      name: 'Feature research',
      state: 'RUNNING',
      currentStage: 'Leakage harness',
    },
  },
  {
    id: 'feat-crowding',
    slug: 'crowding-score',
    name: 'Crowding score',
    description: 'Positioning-based crowding indicator.',
    category: 'LIQUIDITY',
    assetClass: 'FX',
    valueType: 'CONTINUOUS',
    owner: 'Quant Research',
    version: '0.4.0',
    status: 'REJECTED',
    approval: {
      state: 'REJECTED',
      submittedAt: '2026-06-20T00:00:00.000Z',
      decidedAt: '2026-07-02T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    leakageHarness: 'FAILED',
    provenanceComplete: false,
    registryId: 'FRG-000210',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
    registeredAt: '2026-06-05T00:00:00.000Z',
    tags: ['fx', 'crowding', 'positioning'],
    validation: {
      status: 'FAILED',
      checkedAt: '2026-07-02T00:00:00.000Z',
      issues: [
        { code: 'LEAK-007', severity: 'ERROR', message: 'Look-ahead in positioning inputs.' },
      ],
    },
    dependsOn: [],
    datasetRefs: [{ id: 'ds-fx-spot', name: 'FX Spot Rates', version: '1.4.0' }],
    usage: {
      experiments: [{ id: 'exp-carry-fx', name: 'FX carry with crowding adjustment' }],
      signals: [],
    },
    versions: [
      {
        version: '0.4.0',
        registeredAt: '2026-06-05T00:00:00.000Z',
        note: 'Rejected at leakage harness.',
      },
    ],
    lineage: [
      { id: 'ds-fx-spot', label: 'FX Spot Rates', kind: 'dataset' },
      { id: 'feat-crowding', label: 'Crowding score', kind: 'feature' },
    ],
    workflow: {
      workflowRef: 'WFC-44',
      name: 'Feature research',
      state: 'COMPLETED',
      currentStage: 'Rejected',
    },
  },
  {
    id: 'feat-curve-value',
    slug: 'curve-value-score',
    name: 'Curve value score',
    description: 'Rich/cheap score across the government curve.',
    category: 'VALUE',
    assetClass: 'RATES',
    valueType: 'CONTINUOUS',
    owner: 'Quant Research',
    version: '0.2.0',
    status: 'DRAFT',
    approval: { state: 'NOT_SUBMITTED' },
    leakageHarness: 'NOT_RUN',
    provenanceComplete: true,
    createdAt: '2026-07-18T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    tags: ['rates', 'value', 'curve'],
    validation: { status: 'NOT_RUN', issues: [] },
    dependsOn: [],
    datasetRefs: [{ id: 'ds-rates-curves', name: 'Rates Curves', version: '3.0.0' }],
    usage: {
      experiments: [{ id: 'exp-rates-value', name: 'Curve value in government rates' }],
      signals: [],
    },
    versions: [{ version: '0.2.0', registeredAt: '2026-07-18T00:00:00.000Z', note: 'Draft.' }],
    lineage: [
      { id: 'ds-rates-curves', label: 'Rates Curves', kind: 'dataset' },
      { id: 'feat-curve-value', label: 'Curve value score', kind: 'feature' },
    ],
    workflow: {
      workflowRef: 'WFC-44',
      name: 'Feature research',
      state: 'NOT_STARTED',
      currentStage: 'Draft',
    },
  },
  {
    id: 'feat-spread-mom',
    slug: 'spread-momentum-3m',
    name: 'Spread momentum (3m)',
    description: 'Three-month momentum of credit spreads.',
    category: 'MOMENTUM',
    assetClass: 'CREDIT',
    valueType: 'CONTINUOUS',
    owner: 'Quant Research',
    version: '1.0.0',
    status: 'DEPRECATED',
    approval: {
      state: 'APPROVED',
      submittedAt: '2026-01-25T00:00:00.000Z',
      decidedAt: '2026-02-05T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    leakageHarness: 'PASSED',
    provenanceComplete: true,
    manifestRef: 'manifest/feat-spread-mom@1.0.0',
    registryId: 'FRG-000088',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-06-30T00:00:00.000Z',
    registeredAt: '2026-01-12T00:00:00.000Z',
    tags: ['credit', 'momentum'],
    validation: {
      status: 'PASSED',
      checkedAt: '2026-02-05T00:00:00.000Z',
      issues: [
        {
          code: 'DEPR-2',
          severity: 'WARNING',
          message: 'Superseded after refuted experiment; scheduled for retirement.',
        },
      ],
    },
    dependsOn: [],
    datasetRefs: [{ id: 'ds-credit-spreads', name: 'Credit Spreads', version: '0.9.0' }],
    usage: {
      experiments: [{ id: 'exp-credit-momentum', name: 'Cross-sectional credit momentum' }],
      signals: [],
    },
    versions: [
      { version: '1.0.0', registeredAt: '2026-01-12T00:00:00.000Z', note: 'Initial release.' },
    ],
    lineage: [
      { id: 'ds-credit-spreads', label: 'Credit Spreads', kind: 'dataset' },
      { id: 'feat-spread-mom', label: 'Spread momentum (3m)', kind: 'feature' },
    ],
    workflow: {
      workflowRef: 'WFC-44',
      name: 'Feature research',
      state: 'COMPLETED',
      currentStage: 'Deprecated',
    },
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockFeatureRepository implements FeatureRepository {
  private readonly data: readonly FeatureDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly FeatureDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: FeatureQuery): Promise<readonly FeatureDto[]> {
    await this.delay();
    return applyFeatureQuery(this.data, query);
  }

  async getById(id: string): Promise<FeatureDto | null> {
    await this.delay();
    return this.data.find((feature) => feature.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const FEATURE_SEED = SEED;
