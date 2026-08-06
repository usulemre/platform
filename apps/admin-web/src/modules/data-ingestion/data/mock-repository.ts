/**
 * In-memory mock adapter for the data-ingestion admin UI. Synthetic METADATA
 * ONLY — no real payloads, no persistence, no external calls. Pipelines reference
 * connectors and datasets by ref so links stay resolvable. This is the UI's own
 * mock, independent of the service tier.
 */
import {
  DEFAULT_RETRY_POLICY,
  PIPELINE_STAGES,
  type JobRecord,
  type PipelineEvent,
  type PipelineRecord,
  type SourceRef,
  type StageState,
} from '@platform/data-sdk';
import { applyPipelineQuery, type PipelineQuery } from '../domain/query';
import type { DataIngestionRepository } from './repository';

function stages(
  active: (typeof PIPELINE_STAGES)[number],
  failed?: (typeof PIPELINE_STAGES)[number],
): StageState[] {
  const activeOrder = PIPELINE_STAGES.indexOf(active);
  return PIPELINE_STAGES.map((stage, index) => {
    if (failed && stage === failed) return { stage, state: 'FAIL' };
    if (index < activeOrder) return { stage, state: 'PASS' };
    if (index === activeOrder) return { stage, state: 'ACTIVE' };
    return { stage, state: 'PENDING' };
  });
}

const SOURCES: readonly SourceRef[] = [
  {
    id: 'SRC-BINANCE-OHLCV',
    name: 'Binance spot OHLCV',
    connectorRef: 'CN-BINANCE',
    connectorType: 'EXCHANGE',
  },
  {
    id: 'SRC-DERIBIT-OPTIONS',
    name: 'Deribit options chains',
    connectorRef: 'CN-DERIBIT',
    connectorType: 'OPTIONS',
  },
  {
    id: 'SRC-POLYGON-EQUITY',
    name: 'Polygon US equities',
    connectorRef: 'CN-POLYGON',
    connectorType: 'MARKET_DATA',
  },
  {
    id: 'SRC-FRED-MACRO',
    name: 'FRED macro series',
    connectorRef: 'CN-FRED',
    connectorType: 'MACRO_DATA',
  },
];

const PIPELINES: readonly PipelineRecord[] = [
  {
    id: 'PL-BINANCE-OHLCV',
    slug: 'binance-ohlcv',
    name: 'Binance OHLCV ingestion',
    description: 'Ingests Binance spot OHLCV bars into the canonical bar dataset.',
    dataType: 'OHLCV',
    source: SOURCES[0]!,
    capabilities: [
      'SCHEMA_VALIDATION',
      'NORMALIZATION',
      'DEDUPLICATION',
      'DATA_VERSIONING',
      'QUALITY_VALIDATION',
      'RETRY_POLICIES',
      'PIPELINE_METRICS',
    ],
    retryPolicy: DEFAULT_RETRY_POLICY,
    schemaRef: 'SCHEMA-OHLCV-1',
    datasetRef: 'ds-binance-ohlcv',
    owner: 'MKT',
    team: 'Market Data',
    version: '1.3.0',
    environment: 'PRODUCTION',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stages: stages('STORAGE'),
    metrics: {
      recordsIngested: '184.2M',
      throughput: '12.4k/s',
      avgLatency: '84ms',
      errorRate: '0.02%',
      lastRunAt: '2026-08-02T00:00:00.000Z',
    },
    quality: {
      grade: 'PASS',
      completeness: 0.999,
      validity: 0.999,
      checkedAt: '2026-08-02T00:00:00.000Z',
    },
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
    registeredAt: '2026-03-05T00:00:00.000Z',
  },
  {
    id: 'PL-DERIBIT-OPTIONS',
    slug: 'deribit-options',
    name: 'Deribit options chains ingestion',
    description: 'Ingests Deribit options chains and greeks into the canonical options dataset.',
    dataType: 'OPTIONS_CHAINS',
    source: SOURCES[1]!,
    capabilities: [
      'SCHEMA_VALIDATION',
      'NORMALIZATION',
      'QUALITY_VALIDATION',
      'RETRY_POLICIES',
      'DEAD_LETTER_QUEUE',
      'PIPELINE_METRICS',
      'PIPELINE_EVENTS',
    ],
    retryPolicy: DEFAULT_RETRY_POLICY,
    schemaRef: 'SCHEMA-OPTIONS-1',
    datasetRef: 'ds-deribit-options',
    owner: 'MKT',
    team: 'Market Data',
    version: '1.0.0',
    environment: 'PRODUCTION',
    status: 'DEGRADED',
    health: 'DEGRADED',
    stages: stages('QUALITY_VALIDATION'),
    metrics: {
      recordsIngested: '22.7M',
      throughput: '3.1k/s',
      avgLatency: '160ms',
      errorRate: '1.4%',
      lastRunAt: '2026-08-01T00:00:00.000Z',
    },
    quality: {
      grade: 'WARN',
      completeness: 0.972,
      validity: 0.981,
      checkedAt: '2026-08-01T00:00:00.000Z',
    },
    createdAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    registeredAt: '2026-04-14T00:00:00.000Z',
  },
  {
    id: 'PL-POLYGON-CA',
    slug: 'polygon-corporate-actions',
    name: 'Polygon corporate actions ingestion',
    description: 'Ingests corporate actions with vintage-aware restatement handling.',
    dataType: 'CORPORATE_ACTIONS',
    source: SOURCES[2]!,
    capabilities: [
      'SCHEMA_VALIDATION',
      'NORMALIZATION',
      'DATA_VERSIONING',
      'METADATA_GENERATION',
      'QUALITY_VALIDATION',
      'PIPELINE_EVENTS',
    ],
    retryPolicy: DEFAULT_RETRY_POLICY,
    schemaRef: 'SCHEMA-CA-1',
    datasetRef: 'ds-polygon-ca',
    owner: 'RES',
    team: 'Research Data',
    version: '0.9.0',
    environment: 'PRODUCTION',
    status: 'FAILED',
    health: 'DOWN',
    stages: stages('SCHEMA_VALIDATION', 'SCHEMA_VALIDATION'),
    metrics: {
      recordsIngested: '1.1M',
      throughput: '—',
      avgLatency: '—',
      errorRate: '6.2%',
      lastRunAt: '2026-07-31T00:00:00.000Z',
    },
    quality: {
      grade: 'FAIL',
      completeness: 0.88,
      validity: 0.91,
      checkedAt: '2026-07-31T00:00:00.000Z',
    },
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
    registeredAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'PL-FRED-MACRO',
    slug: 'fred-macro',
    name: 'FRED macro ingestion',
    description: 'Ingests FRED macro series with point-in-time vintages.',
    dataType: 'MACRO_DATA',
    source: SOURCES[3]!,
    capabilities: [
      'SCHEMA_VALIDATION',
      'NORMALIZATION',
      'DATA_VERSIONING',
      'METADATA_GENERATION',
      'QUALITY_VALIDATION',
    ],
    retryPolicy: DEFAULT_RETRY_POLICY,
    schemaRef: 'SCHEMA-MACRO-1',
    datasetRef: 'ds-fred-macro',
    owner: 'RES',
    team: 'Research Data',
    version: '1.0.0',
    environment: 'PRODUCTION',
    status: 'ACTIVE',
    health: 'HEALTHY',
    stages: stages('STORAGE'),
    metrics: {
      recordsIngested: '780K',
      throughput: '900/s',
      avgLatency: '140ms',
      errorRate: '0.03%',
      lastRunAt: '2026-08-01T00:00:00.000Z',
    },
    quality: {
      grade: 'PASS',
      completeness: 0.998,
      validity: 0.999,
      checkedAt: '2026-08-01T00:00:00.000Z',
    },
    createdAt: '2026-02-06T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    registeredAt: '2026-02-06T00:00:00.000Z',
  },
];

const JOBS: readonly JobRecord[] = [
  {
    id: 'JOB-1001',
    pipelineId: 'PL-BINANCE-OHLCV',
    pipelineName: 'Binance OHLCV ingestion',
    dataType: 'OHLCV',
    status: 'SUCCEEDED',
    attempt: 1,
    maxAttempts: 5,
    stage: 'STORAGE',
    enqueuedAt: '2026-08-02T00:00:00.000Z',
    startedAt: '2026-08-02T00:00:01.000Z',
    finishedAt: '2026-08-02T00:00:20.000Z',
  },
  {
    id: 'JOB-1002',
    pipelineId: 'PL-DERIBIT-OPTIONS',
    pipelineName: 'Deribit options chains ingestion',
    dataType: 'OPTIONS_CHAINS',
    status: 'RETRYING',
    attempt: 2,
    maxAttempts: 5,
    stage: 'QUALITY_VALIDATION',
    error: 'Quality gate below WARN threshold on far-dated tenors.',
    enqueuedAt: '2026-08-01T00:00:00.000Z',
    startedAt: '2026-08-01T00:00:02.000Z',
  },
  {
    id: 'JOB-1003',
    pipelineId: 'PL-POLYGON-CA',
    pipelineName: 'Polygon corporate actions ingestion',
    dataType: 'CORPORATE_ACTIONS',
    status: 'FAILED',
    attempt: 3,
    maxAttempts: 5,
    stage: 'SCHEMA_VALIDATION',
    error: 'Schema mismatch: unexpected field `adj_factor_v2`.',
    enqueuedAt: '2026-07-31T00:00:00.000Z',
    startedAt: '2026-07-31T00:00:01.000Z',
    finishedAt: '2026-07-31T00:00:05.000Z',
  },
  {
    id: 'JOB-1004',
    pipelineId: 'PL-POLYGON-CA',
    pipelineName: 'Polygon corporate actions ingestion',
    dataType: 'CORPORATE_ACTIONS',
    status: 'DEAD_LETTER',
    attempt: 5,
    maxAttempts: 5,
    stage: 'SCHEMA_VALIDATION',
    error: 'Retry budget exhausted; quarantined for review.',
    enqueuedAt: '2026-07-30T00:00:00.000Z',
    startedAt: '2026-07-30T00:00:01.000Z',
    finishedAt: '2026-07-30T00:01:00.000Z',
  },
  {
    id: 'JOB-1005',
    pipelineId: 'PL-FRED-MACRO',
    pipelineName: 'FRED macro ingestion',
    dataType: 'MACRO_DATA',
    status: 'RUNNING',
    attempt: 1,
    maxAttempts: 5,
    stage: 'NORMALIZATION',
    enqueuedAt: '2026-08-02T00:00:00.000Z',
    startedAt: '2026-08-02T00:00:01.000Z',
  },
  {
    id: 'JOB-1006',
    pipelineId: 'PL-BINANCE-OHLCV',
    pipelineName: 'Binance OHLCV ingestion',
    dataType: 'OHLCV',
    status: 'QUEUED',
    attempt: 0,
    maxAttempts: 5,
    stage: 'SOURCE',
    enqueuedAt: '2026-08-02T00:05:00.000Z',
  },
];

const EVENTS: readonly PipelineEvent[] = [
  {
    id: 'EV-1',
    pipelineId: 'PL-BINANCE-OHLCV',
    type: 'SUCCEEDED',
    message: 'Run completed; dataset version registered.',
    stage: 'DATASET_REGISTRY',
    actor: 'runner',
    occurredAt: '2026-08-02T00:00:20.000Z',
  },
  {
    id: 'EV-2',
    pipelineId: 'PL-DERIBIT-OPTIONS',
    type: 'RETRIED',
    message: 'Quality gate warned; scheduled retry (attempt 2).',
    stage: 'QUALITY_VALIDATION',
    actor: 'runner',
    occurredAt: '2026-08-01T00:00:10.000Z',
  },
  {
    id: 'EV-3',
    pipelineId: 'PL-POLYGON-CA',
    type: 'FAILED',
    message: 'Schema validation failed on unexpected field.',
    stage: 'SCHEMA_VALIDATION',
    actor: 'runner',
    occurredAt: '2026-07-31T00:00:05.000Z',
  },
  {
    id: 'EV-4',
    pipelineId: 'PL-POLYGON-CA',
    type: 'DEAD_LETTERED',
    message: 'Job quarantined to dead-letter queue.',
    stage: 'SCHEMA_VALIDATION',
    actor: 'runner',
    occurredAt: '2026-07-30T00:01:00.000Z',
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockDataIngestionRepository implements DataIngestionRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listPipelines(query: PipelineQuery): Promise<readonly PipelineRecord[]> {
    await this.delay();
    return applyPipelineQuery(PIPELINES, query);
  }

  async getPipeline(id: string): Promise<PipelineRecord | null> {
    await this.delay();
    return PIPELINES.find((pipeline) => pipeline.id === id) ?? null;
  }

  async listJobs(): Promise<readonly JobRecord[]> {
    await this.delay();
    return JOBS;
  }

  async listEvents(pipelineId: string): Promise<readonly PipelineEvent[]> {
    await this.delay();
    return EVENTS.filter((event) => event.pipelineId === pipelineId);
  }

  async listSources(): Promise<readonly SourceRef[]> {
    await this.delay();
    return SOURCES;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const DATA_INGESTION_SEED = {
  pipelines: PIPELINES,
  jobs: JOBS,
  events: EVENTS,
  sources: SOURCES,
} as const;
