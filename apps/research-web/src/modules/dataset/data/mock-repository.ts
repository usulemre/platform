/**
 * In-memory mock adapter for development. Contains synthetic METADATA ONLY — no
 * real vendor data, no secrets, no persistence, no live ingestion (FB-14). It
 * exists so the module is fully functional before the governed backend endpoints
 * are available; swap it for ApiDatasetRepository at the composition root.
 */
import type { DatasetDto } from '../domain/dto';
import { applyDatasetQuery, type DatasetQuery } from '../domain/query';
import type { DatasetRepository } from './repository';

const SEED: readonly DatasetDto[] = [
  {
    id: 'ds-equity-eod',
    slug: 'us-equity-prices-eod',
    name: 'US Equity Prices (EOD)',
    description: 'End-of-day adjusted prices for the US equity universe.',
    status: 'CERTIFIED',
    assetClass: 'EQUITY',
    vendor: 'VendorA',
    owner: 'Data Engineering',
    version: '4.2.0',
    rowCount: 18452331,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
    eventTime: '2026-07-25T00:00:00.000Z',
    knowledgeTime: '2026-07-26T00:00:00.000Z',
    tags: ['equity', 'prices', 'eod'],
    provenanceComplete: true,
    lineageRef: 'lineage/ds-equity-eod',
    validation: {
      status: 'PASSED',
      checkedAt: '2026-07-28T00:00:00.000Z',
      issues: [],
    },
    versions: [
      {
        version: '4.2.0',
        knowledgeTime: '2026-07-26T00:00:00.000Z',
        note: 'Vendor restatement applied.',
      },
      { version: '4.1.0', knowledgeTime: '2026-06-30T00:00:00.000Z', note: 'Quarterly refresh.' },
    ],
    lineage: [
      { id: 'raw-vendora-eod', label: 'VendorA EOD (raw vault)', kind: 'source' },
      { id: 'canonical-equity', label: 'Canonical equity prices', kind: 'canonical' },
    ],
  },
  {
    id: 'ds-corp-actions',
    slug: 'corporate-actions',
    name: 'Corporate Actions',
    description: 'Splits, dividends and symbology changes with vintages.',
    status: 'CERTIFIED',
    assetClass: 'EQUITY',
    vendor: 'VendorB',
    owner: 'Data Engineering',
    version: '2.9.1',
    rowCount: 942117,
    createdAt: '2024-03-02T00:00:00.000Z',
    updatedAt: '2026-07-20T00:00:00.000Z',
    eventTime: '2026-07-18T00:00:00.000Z',
    knowledgeTime: '2026-07-19T00:00:00.000Z',
    tags: ['equity', 'corporate-actions', 'reference'],
    provenanceComplete: true,
    validation: {
      status: 'PASSED',
      checkedAt: '2026-07-20T00:00:00.000Z',
      issues: [{ code: 'GAP-001', severity: 'INFO', message: 'Sparse coverage before 2005.' }],
    },
  },
  {
    id: 'ds-fx-spot',
    slug: 'fx-spot-rates',
    name: 'FX Spot Rates',
    description: 'Intraday spot rates for major and minor currency pairs.',
    status: 'INGESTED',
    assetClass: 'FX',
    vendor: 'VendorA',
    owner: 'Data Engineering',
    version: '1.4.0',
    rowCount: 5230981,
    createdAt: '2025-11-10T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    eventTime: '2026-07-29T00:00:00.000Z',
    knowledgeTime: '2026-07-29T00:00:00.000Z',
    tags: ['fx', 'spot', 'intraday'],
    provenanceComplete: true,
    validation: {
      status: 'PENDING',
      issues: [],
    },
  },
  {
    id: 'ds-credit-spreads',
    slug: 'credit-spreads',
    name: 'Credit Spreads',
    description: 'CDS and bond spread history for the credit universe.',
    status: 'QUARANTINED',
    assetClass: 'CREDIT',
    vendor: 'VendorC',
    owner: 'Data Engineering',
    version: '0.9.0',
    rowCount: 1200455,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
    eventTime: '2026-07-14T00:00:00.000Z',
    knowledgeTime: '2026-07-15T00:00:00.000Z',
    tags: ['credit', 'spreads'],
    provenanceComplete: false,
    validation: {
      status: 'FAILED',
      checkedAt: '2026-07-15T00:00:00.000Z',
      issues: [
        { code: 'PIT-014', severity: 'ERROR', message: 'Look-ahead detected in spread revisions.' },
        { code: 'PROV-003', severity: 'WARNING', message: 'Incomplete lineage to raw source.' },
      ],
    },
  },
  {
    id: 'ds-rates-curves',
    slug: 'rates-curves',
    name: 'Rates Curves',
    description: 'Bootstrapped government and swap curves.',
    status: 'DEPRECATED',
    assetClass: 'RATES',
    vendor: 'VendorB',
    owner: 'Data Engineering',
    version: '3.0.0',
    rowCount: 733210,
    createdAt: '2023-09-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    eventTime: '2026-04-30T00:00:00.000Z',
    knowledgeTime: '2026-05-01T00:00:00.000Z',
    tags: ['rates', 'curves'],
    provenanceComplete: true,
    validation: {
      status: 'PASSED',
      checkedAt: '2026-05-01T00:00:00.000Z',
      issues: [
        {
          code: 'DEPR-1',
          severity: 'WARNING',
          message: 'Superseded by Rates Curves v4 (in progress).',
        },
      ],
    },
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockDatasetRepository implements DatasetRepository {
  private readonly data: readonly DatasetDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly DatasetDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: DatasetQuery): Promise<readonly DatasetDto[]> {
    await this.delay();
    return applyDatasetQuery(this.data, query);
  }

  async getById(id: string): Promise<DatasetDto | null> {
    await this.delay();
    return this.data.find((dataset) => dataset.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const DATASET_SEED = SEED;
