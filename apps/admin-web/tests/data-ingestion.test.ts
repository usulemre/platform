import { describe, it, expect } from 'vitest';
import { DATA_TYPES, PIPELINE_STAGES, describeDataType } from '@platform/data-sdk';
import { applyPipelineQuery } from '../src/modules/data-ingestion/domain/query';
import {
  toDetailVm,
  toListItemVm,
  toSummaryVm,
} from '../src/modules/data-ingestion/domain/mappers';
import { DataIngestionService } from '../src/modules/data-ingestion/application/data-ingestion-service';
import {
  DATA_INGESTION_SEED,
  MockDataIngestionRepository,
} from '../src/modules/data-ingestion/data/mock-repository';

const { pipelines, jobs } = DATA_INGESTION_SEED;

describe('@platform/data-sdk vocabulary is shared', () => {
  it('exposes the ten canonical stages and twelve data types', () => {
    expect(PIPELINE_STAGES).toHaveLength(10);
    expect(DATA_TYPES).toHaveLength(12);
    expect(describeDataType('OHLCV').label).toBe('OHLCV');
  });
});

describe('applyPipelineQuery (pure filter/sort/search)', () => {
  it('filters by data type and status', () => {
    expect(
      applyPipelineQuery(pipelines, { dataType: 'OHLCV' }).every((p) => p.dataType === 'OHLCV'),
    ).toBe(true);
    expect(
      applyPipelineQuery(pipelines, { status: 'FAILED' }).every((p) => p.status === 'FAILED'),
    ).toBe(true);
  });

  it('searches across name, source and owner', () => {
    const result = applyPipelineQuery(pipelines, { search: 'deribit' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('PL-DERIBIT-OPTIONS');
  });
});

describe('mappers (pure DTO → VM)', () => {
  const binance = pipelines[0]!;

  it('maps a list item with tones and shared labels', () => {
    const vm = toListItemVm(binance);
    expect(vm.status.tone).toBe('positive');
    expect(vm.dataType.label).toBe('OHLCV');
    expect(vm.quality.label).toBe('Pass');
  });

  it('maps a detail with all ten stages and formatted quality percentages', () => {
    const vm = toDetailVm(binance);
    expect(vm.stages).toHaveLength(10);
    expect(vm.quality.completeness).toBe('99.9%');
  });

  it('summarizes pipelines and jobs into buckets', () => {
    const summary = toSummaryVm(pipelines, jobs);
    expect(summary.totalPipelines).toBe(pipelines.length);
    expect(summary.deadLetter).toBe(jobs.filter((j) => j.status === 'DEAD_LETTER').length);
    expect(summary.byStatus.every((b) => b.count > 0)).toBe(true);
    expect(summary.byDataType.every((b) => b.count > 0)).toBe(true);
  });
});

describe('DataIngestionService (over the mock repository)', () => {
  const service = new DataIngestionService(new MockDataIngestionRepository());

  it('lists pipelines as view models', async () => {
    expect(await service.listPipelines()).toHaveLength(pipelines.length);
  });

  it('bundles a pipeline with its jobs and events', async () => {
    const bundle = await service.getPipeline('PL-POLYGON-CA');
    expect(bundle).not.toBeNull();
    expect(bundle!.jobs.length).toBeGreaterThan(0);
    expect(bundle!.events.length).toBeGreaterThan(0);
    expect(await service.getPipeline('nope')).toBeNull();
  });

  it('partitions failed, retry and dead-letter queues', async () => {
    expect((await service.getFailedJobs()).every((j) => j.status.value === 'FAILED')).toBe(true);
    expect((await service.getRetryQueue()).length).toBeGreaterThan(0);
    expect((await service.getDeadLetterJobs()).every((j) => j.status.value === 'DEAD_LETTER')).toBe(
      true,
    );
  });

  it('builds source and quality overviews', async () => {
    const sources = await service.getDataSourceOverview();
    expect(sources.reduce((sum, s) => sum + s.pipelineCount, 0)).toBe(pipelines.length);
    expect(await service.getDataQualityOverview()).toHaveLength(pipelines.length);
  });
});
