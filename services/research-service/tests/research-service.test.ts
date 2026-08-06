import { describe, it, expect } from 'vitest';
import { RESEARCH_STAGES, nextStage } from '@platform/research-sdk';
import {
  advance,
  canAdvance,
  computeProgress,
  currentStage,
  hasSkipViolation,
} from '../ts/domain/lifecycle-rules';
import { hasCycle, isStageReady } from '../ts/domain/dependencies';
import { ResearchProjectAggregate } from '../ts/domain/research-project';
import { createResearchService } from '../ts/composition';
import { PROJECTS } from '../ts/infrastructure/in-memory/seed';

const AT = '2026-08-02T00:00:00.000Z';
const momentum = PROJECTS.find((p) => p.id === 'RP-MOMENTUM')!;
const rates = PROJECTS.find((p) => p.id === 'RP-RATES')!;
const seasonal = PROJECTS.find((p) => p.id === 'RP-SEASONAL')!;

describe('lifecycle SDK', () => {
  it('orders 12 stages hypothesis → approval', () => {
    expect(RESEARCH_STAGES).toHaveLength(12);
    expect(RESEARCH_STAGES[0]).toBe('HYPOTHESIS');
    expect(RESEARCH_STAGES[11]).toBe('APPROVAL');
    expect(nextStage('APPROVAL')).toBeNull();
  });
});

describe('lifecycle rules (pure, no skipping)', () => {
  it('reports the current stage from stage states', () => {
    expect(currentStage(momentum.stages)).toBe('SIGNAL_VALIDATION');
  });

  it('advances one gated step, completing current and starting next', () => {
    const result = advance(momentum.stages, AT);
    expect(result.changed).toBe(true);
    expect(result.advancedTo).toBe('STRATEGY_RESEARCH');
    expect(result.stages.find((s) => s.stage === 'SIGNAL_VALIDATION')?.state).toBe('COMPLETE');
    expect(hasSkipViolation(result.stages)).toBe(false);
  });

  it('does not advance a blocked project', () => {
    expect(canAdvance(seasonal.stages)).toBe(false);
    expect(advance(seasonal.stages, AT).changed).toBe(false);
  });

  it('computes progress percent and current stage', () => {
    const progress = computeProgress(rates.stages);
    expect(progress.currentStage).toBe('APPROVAL');
    expect(progress.percent).toBeGreaterThan(80);
  });
});

describe('dependencies (pure)', () => {
  it('flags a cycle when a stage depends on a later-or-equal stage', () => {
    expect(
      hasCycle([
        {
          id: 'x',
          stage: 'FEATURE_RESEARCH',
          dependsOnStage: 'SIGNAL_RESEARCH',
          status: 'PENDING',
        },
      ]),
    ).toBe(true);
    expect(hasCycle(momentum.dependencies)).toBe(false);
  });

  it('marks a stage ready only when upstream stages are complete', () => {
    expect(isStageReady('FEATURE_RESEARCH', momentum.dependencies, momentum.stages)).toBe(true);
  });
});

describe('ResearchProjectAggregate', () => {
  it('derives progress, open objectives and pending reviews', () => {
    const aggregate = new ResearchProjectAggregate(momentum);
    expect(aggregate.currentStage()).toBe('SIGNAL_VALIDATION');
    expect(aggregate.openObjectives()).toBeGreaterThan(0);
    expect(aggregate.pendingReviews().length).toBeGreaterThan(0);
    expect(aggregate.isConsistent()).toBe(true);
  });

  it('computes age-based metrics deterministically', () => {
    const metrics = new ResearchProjectAggregate(momentum).metrics(AT);
    expect(metrics.artifacts).toBe('3');
    expect(metrics.ageDays.endsWith('d')).toBe(true);
  });
});

describe('ResearchService (over in-memory ports)', () => {
  const service = createResearchService();

  it('summarizes projects by status and stage', async () => {
    const summary = await service.getSummary();
    expect(summary.totalProjects).toBe(PROJECTS.length);
    expect(summary.blocked).toBe(1);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.byStage.length).toBeGreaterThan(0);
  });

  it('advances a project and records an event + workflow schedule; null for unknown', async () => {
    const outcome = await service.advanceStage('RP-MOMENTUM', AT);
    expect(outcome?.advancedTo).toBe('STRATEGY_RESEARCH');
    expect(await service.advanceStage('nope', AT)).toBeNull();
  });

  it('lists module artifacts by kind and exposes the workspace handle', async () => {
    expect((await service.listModuleArtifacts('DATASET')).every((a) => a.kind === 'DATASET')).toBe(
      true,
    );
    expect((await service.getWorkspace()).href).toBe('/workspace');
  });
});
