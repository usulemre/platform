/**
 * In-memory mock adapter for development. Synthetic METADATA ONLY — no signal
 * generation, no statistics, no trading/execution, no persistence (all out of
 * scope / forbidden). Feature/experiment references use ids from those modules'
 * seeds so cross-links resolve. Quality ratings are pre-assessed values.
 */
import type { SignalDto } from '../domain/dto';
import { applySignalQuery, type SignalQuery } from '../domain/query';
import type { SignalRepository } from './repository';

const SEED: readonly SignalDto[] = [
  {
    id: 'sig-reversal',
    slug: 'short-horizon-reversal',
    name: 'Reversal signal',
    description: 'Advisory short-horizon reversal signal for US equities.',
    category: 'REVERSAL',
    assetClass: 'EQUITY',
    horizon: '1–5 days',
    owner: 'Quant Research',
    version: '1.3.0',
    status: 'APPROVED',
    approval: {
      state: 'APPROVED',
      submittedAt: '2026-05-22T00:00:00.000Z',
      decidedAt: '2026-05-30T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    executionEligibility: 'PAPER_ONLY',
    provenanceComplete: true,
    manifestRef: 'manifest/sig-reversal@1.3.0',
    registryId: 'SIG-000077',
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-07-26T00:00:00.000Z',
    registeredAt: '2026-05-12T00:00:00.000Z',
    tags: ['equity', 'reversal', 'advisory'],
    validation: { status: 'PASSED', checkedAt: '2026-05-30T00:00:00.000Z', issues: [] },
    quality: [
      { key: 'coverage', label: 'Coverage', value: '96% of universe', rating: 'GOOD' },
      { key: 'decay', label: 'Decay half-life', value: '4 days', rating: 'MODERATE' },
      { key: 'capacity', label: 'Capacity', value: 'High', rating: 'GOOD' },
      { key: 'crowding', label: 'Crowding', value: 'Low', rating: 'GOOD' },
    ],
    dependsOnFeatures: [
      { id: 'feat-resid-return', name: 'Residual return (1d)', version: '2.1.0' },
      { id: 'feat-market-beta', name: 'Market beta', version: '1.5.0' },
    ],
    strategyRefs: [{ id: 'str-reversal-ls', name: 'Reversal long/short' }],
    experimentRefs: [
      { id: 'exp-momentum-reversal', name: 'Short-horizon reversal in US equities' },
    ],
    versions: [
      {
        version: '1.3.0',
        registeredAt: '2026-07-01T00:00:00.000Z',
        note: 'Recalibrated decay window.',
      },
      {
        version: '1.2.0',
        registeredAt: '2026-05-12T00:00:00.000Z',
        note: 'Initial approved release.',
      },
    ],
    lineage: [
      { id: 'feat-resid-return', label: 'Residual return (1d)', kind: 'feature' },
      { id: 'feat-market-beta', label: 'Market beta', kind: 'feature' },
      { id: 'sig-reversal', label: 'Reversal signal', kind: 'signal' },
    ],
    workflow: {
      workflowRef: 'WFC-46',
      name: 'Validation',
      state: 'COMPLETED',
      currentStage: 'Approved (paper)',
    },
  },
  {
    id: 'sig-fx-carry',
    slug: 'fx-carry',
    name: 'FX carry signal',
    description: 'Advisory carry signal across G10 FX.',
    category: 'CARRY',
    assetClass: 'FX',
    horizon: '1 month',
    owner: 'Quant Research',
    version: '0.8.0',
    status: 'UNDER_VALIDATION',
    approval: { state: 'PENDING', submittedAt: '2026-07-06T00:00:00.000Z' },
    executionEligibility: 'NOT_ELIGIBLE',
    provenanceComplete: true,
    manifestRef: 'manifest/sig-fx-carry@0.8.0',
    registryId: 'SIG-000121',
    createdAt: '2026-06-18T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    registeredAt: '2026-06-20T00:00:00.000Z',
    tags: ['fx', 'carry', 'advisory'],
    validation: { status: 'PENDING', issues: [] },
    quality: [
      { key: 'coverage', label: 'Coverage', value: 'G10 complete', rating: 'GOOD' },
      { key: 'crowding', label: 'Crowding', value: 'Elevated', rating: 'MODERATE' },
      { key: 'capacity', label: 'Capacity', value: 'Not assessed', rating: 'NOT_ASSESSED' },
    ],
    dependsOnFeatures: [{ id: 'feat-carry', name: 'Carry signal', version: '0.9.0' }],
    strategyRefs: [],
    experimentRefs: [{ id: 'exp-carry-fx', name: 'FX carry with crowding adjustment' }],
    versions: [
      {
        version: '0.8.0',
        registeredAt: '2026-06-20T00:00:00.000Z',
        note: 'Submitted for validation.',
      },
    ],
    lineage: [
      { id: 'feat-carry', label: 'Carry signal', kind: 'feature' },
      { id: 'sig-fx-carry', label: 'FX carry signal', kind: 'signal' },
    ],
    workflow: {
      workflowRef: 'WFC-46',
      name: 'Validation',
      state: 'RUNNING',
      currentStage: 'Purged/embargoed CV',
    },
  },
  {
    id: 'sig-credit-mom',
    slug: 'credit-momentum',
    name: 'Credit momentum signal',
    description: 'Advisory credit-spread momentum signal.',
    category: 'MOMENTUM',
    assetClass: 'CREDIT',
    horizon: '3 months',
    owner: 'Quant Research',
    version: '1.0.0',
    status: 'RETIRED',
    approval: {
      state: 'APPROVED',
      submittedAt: '2026-02-10T00:00:00.000Z',
      decidedAt: '2026-02-20T00:00:00.000Z',
      decidedBy: 'Scientific Governance',
    },
    executionEligibility: 'NOT_ELIGIBLE',
    provenanceComplete: true,
    manifestRef: 'manifest/sig-credit-mom@1.0.0',
    registryId: 'SIG-000034',
    createdAt: '2026-01-20T00:00:00.000Z',
    updatedAt: '2026-06-30T00:00:00.000Z',
    registeredAt: '2026-01-22T00:00:00.000Z',
    tags: ['credit', 'momentum'],
    validation: {
      status: 'PASSED',
      checkedAt: '2026-06-28T00:00:00.000Z',
      issues: [
        {
          code: 'RET-001',
          severity: 'INFO',
          message: 'Retired after originating experiment was refuted (SM-4).',
        },
      ],
    },
    quality: [
      { key: 'decay', label: 'Decay half-life', value: '55 days', rating: 'POOR' },
      { key: 'capacity', label: 'Capacity', value: 'Low', rating: 'POOR' },
    ],
    dependsOnFeatures: [{ id: 'feat-spread-mom', name: 'Spread momentum (3m)', version: '1.0.0' }],
    strategyRefs: [],
    experimentRefs: [{ id: 'exp-credit-momentum', name: 'Cross-sectional credit momentum' }],
    versions: [
      { version: '1.0.0', registeredAt: '2026-01-22T00:00:00.000Z', note: 'Initial release.' },
    ],
    lineage: [
      { id: 'feat-spread-mom', label: 'Spread momentum (3m)', kind: 'feature' },
      { id: 'sig-credit-mom', label: 'Credit momentum signal', kind: 'signal' },
    ],
    workflow: {
      workflowRef: 'WFC-46',
      name: 'Validation',
      state: 'COMPLETED',
      currentStage: 'Retired',
    },
  },
  {
    id: 'sig-rates-value',
    slug: 'rates-value',
    name: 'Rates value signal',
    description: 'Advisory curve value signal (draft).',
    category: 'VALUE',
    assetClass: 'RATES',
    horizon: '1 month',
    owner: 'Quant Research',
    version: '0.2.0',
    status: 'DRAFT',
    approval: { state: 'NOT_SUBMITTED' },
    executionEligibility: 'NOT_ELIGIBLE',
    provenanceComplete: true,
    createdAt: '2026-07-19T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    tags: ['rates', 'value', 'advisory'],
    validation: { status: 'NOT_RUN', issues: [] },
    quality: [
      { key: 'coverage', label: 'Coverage', value: 'Not assessed', rating: 'NOT_ASSESSED' },
    ],
    dependsOnFeatures: [{ id: 'feat-curve-value', name: 'Curve value score', version: '0.2.0' }],
    strategyRefs: [],
    experimentRefs: [{ id: 'exp-rates-value', name: 'Curve value in government rates' }],
    versions: [{ version: '0.2.0', registeredAt: '2026-07-19T00:00:00.000Z', note: 'Draft.' }],
    lineage: [
      { id: 'feat-curve-value', label: 'Curve value score', kind: 'feature' },
      { id: 'sig-rates-value', label: 'Rates value signal', kind: 'signal' },
    ],
    workflow: {
      workflowRef: 'WFC-43',
      name: 'Research discovery',
      state: 'NOT_STARTED',
      currentStage: 'Draft',
    },
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockSignalRepository implements SignalRepository {
  private readonly data: readonly SignalDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly SignalDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: SignalQuery): Promise<readonly SignalDto[]> {
    await this.delay();
    return applySignalQuery(this.data, query);
  }

  async getById(id: string): Promise<SignalDto | null> {
    await this.delay();
    return this.data.find((signal) => signal.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const SIGNAL_SEED = SEED;
