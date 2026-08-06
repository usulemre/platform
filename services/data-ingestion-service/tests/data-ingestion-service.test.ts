import { describe, it, expect } from 'vitest';
import { DEFAULT_RETRY_POLICY, nextRetryDelayMs, qualityGrade } from '@platform/data-sdk';
import { decideRetry } from '../src/domain/retry-decision';
import { deriveHealth } from '../src/domain/health';
import { createIngestionService, createPipelineRunner } from '../src/composition';
import { PIPELINES } from '../src/infrastructure/in-memory/seed';

const AT = '2026-08-02T00:00:00.000Z';

describe('SDK primitives (retry / quality)', () => {
  it('applies exponential backoff clamped to maxDelay', () => {
    expect(nextRetryDelayMs(1)).toBe(1_000);
    expect(nextRetryDelayMs(2)).toBe(2_000);
    expect(nextRetryDelayMs(3)).toBe(4_000);
    expect(nextRetryDelayMs(100)).toBe(DEFAULT_RETRY_POLICY.maxDelayMs);
  });

  it('grades quality deterministically', () => {
    expect(qualityGrade({ completeness: 0.999, validity: 0.999 })).toBe('PASS');
    expect(qualityGrade({ completeness: 0.97, validity: 0.999 })).toBe('WARN');
    expect(qualityGrade({ completeness: 0.8, validity: 0.999 })).toBe('FAIL');
  });
});

describe('domain: retry decision + health', () => {
  it('retries until the budget is exhausted, then dead-letters', () => {
    expect(decideRetry(2, DEFAULT_RETRY_POLICY)).toEqual({
      action: 'RETRY',
      nextAttempt: 3,
      delayMs: 4_000,
    });
    expect(decideRetry(5, DEFAULT_RETRY_POLICY).action).toBe('DEAD_LETTER');
  });

  it('derives health from status + quality', () => {
    expect(deriveHealth('ACTIVE', 'PASS')).toBe('HEALTHY');
    expect(deriveHealth('ACTIVE', 'WARN')).toBe('DEGRADED');
    expect(deriveHealth('FAILED', 'PASS')).toBe('DOWN');
    expect(deriveHealth('PAUSED', 'PASS')).toBe('UNKNOWN');
  });
});

describe('PipelineRunner (stage orchestration abstraction)', () => {
  const pipeline = PIPELINES[0]!;

  it('walks all stages to success and emits STARTED + SUCCEEDED', async () => {
    const { runner, bus } = createPipelineRunner();
    const result = await runner.run(pipeline, AT);
    expect(result.succeeded).toBe(true);
    expect(result.stages.filter((s) => s.state === 'PASS')).toHaveLength(10);
    expect(bus.published.map((e) => e.type)).toContain('SUCCEEDED');
  });

  it('fails closed at schema validation on rejects', async () => {
    const { runner, bus } = createPipelineRunner({ schemaRejects: 10 });
    const result = await runner.run(pipeline, AT);
    expect(result.succeeded).toBe(false);
    expect(result.failedStage).toBe('SCHEMA_VALIDATION');
    expect(bus.published.some((e) => e.type === 'FAILED')).toBe(true);
  });

  it('fails at quality validation when the gate fails', async () => {
    const { runner } = createPipelineRunner({ completeness: 0.5, validity: 0.5 });
    const result = await runner.run(pipeline, AT);
    expect(result.failedStage).toBe('QUALITY_VALIDATION');
  });
});

describe('IngestionService (over in-memory ports)', () => {
  const service = createIngestionService();

  it('summarizes pipelines and jobs', async () => {
    const summary = await service.getSummary();
    expect(summary.totalPipelines).toBe(PIPELINES.length);
    expect(summary.deadLetter).toBeGreaterThan(0);
  });

  it('partitions the job queues', async () => {
    expect((await service.getFailedJobs()).every((j) => j.status === 'FAILED')).toBe(true);
    expect((await service.getRetryQueue()).length).toBeGreaterThan(0);
    expect((await service.getDeadLetterQueue()).every((j) => j.status === 'DEAD_LETTER')).toBe(
      true,
    );
  });

  it('builds data-source and data-quality overviews', async () => {
    const sources = await service.getDataSourceOverview();
    expect(sources.reduce((sum, s) => sum + s.pipelineCount, 0)).toBe(PIPELINES.length);
    const quality = await service.getDataQualityOverview();
    expect(quality).toHaveLength(PIPELINES.length);
  });

  it('decides retry vs dead-letter for a job and returns null for unknown', async () => {
    const retry = await service.retryJob('JOB-1003', AT); // attempt 3 of 5 → retry
    expect(retry?.action).toBe('RETRY');
    const dead = await service.retryJob('JOB-1004', AT); // attempt 5 of 5 → dead-letter
    expect(dead?.action).toBe('DEAD_LETTER');
    expect(await service.retryJob('nope', AT)).toBeNull();
  });
});
