import { describe, it, expect } from 'vitest';
import { RESEARCH_STAGES, RESEARCH_CAPABILITIES, describeStage } from '@platform/research-sdk';
import { applyProjectQuery } from '../src/modules/research/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/research/domain/mappers';
import { ResearchAdminService } from '../src/modules/research/application/research-service';
import {
  MockResearchRepository,
  RESEARCH_SEED,
} from '../src/modules/research/data/mock-repository';

const { projects } = RESEARCH_SEED;

describe('@platform/research-sdk vocabulary is shared', () => {
  it('exposes 12 lifecycle stages and 12 capabilities', () => {
    expect(RESEARCH_STAGES).toHaveLength(12);
    expect(RESEARCH_CAPABILITIES).toHaveLength(12);
    expect(describeStage('APPROVAL').gate).toBe(true);
  });
});

describe('applyProjectQuery (pure filter/sort/search)', () => {
  it('filters by status', () => {
    expect(
      applyProjectQuery(projects, { status: 'BLOCKED' }).every((p) => p.status === 'BLOCKED'),
    ).toBe(true);
  });

  it('searches across name, owner, team and tags', () => {
    const result = applyProjectQuery(projects, { search: 'carry' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('RP-CARRY');
  });
});

describe('mappers (pure DTO → VM)', () => {
  const momentum = projects.find((p) => p.id === 'RP-MOMENTUM')!;

  it('maps a list item with derived progress and current stage', () => {
    const vm = toListItemVm(momentum);
    expect(vm.status.tone).toBe('positive');
    expect(vm.stageLabel).toBe('Signal validation');
    expect(vm.progress.percent).toBeGreaterThan(0);
    expect(vm.progress.percent).toBeLessThan(100);
  });

  it('maps a detail with all 12 stage steps and artifact deep-links', () => {
    const vm = toDetailVm(momentum);
    expect(vm.stages).toHaveLength(12);
    expect(vm.hypothesis.preRegistered.label).toBe('Pre-registered');
    expect(vm.artifacts.find((a) => a.kind === 'DATASET')?.href).toBe('/datasets/ds-equity-eod');
  });

  it('summarizes by stage and counts awaiting approval', () => {
    const summary = toSummaryVm(projects);
    expect(summary.totalProjects).toBe(projects.length);
    expect(summary.blocked).toBe(1);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.byStage.every((b) => b.count > 0)).toBe(true);
  });
});

describe('ResearchAdminService (over the mock repository)', () => {
  const service = new ResearchAdminService(new MockResearchRepository());

  it('lists projects and a single project detail', async () => {
    expect(await service.listProjects()).toHaveLength(projects.length);
    expect(await service.getProject('RP-RATES')).not.toBeNull();
    expect(await service.getProject('nope')).toBeNull();
  });

  it('exposes templates and the workspace link', async () => {
    expect((await service.listTemplates()).length).toBeGreaterThan(0);
    expect((await service.getWorkspaceLink()).href).toBe('/workspace');
  });

  it('summarizes projects', async () => {
    expect((await service.getSummary()).totalProjects).toBe(projects.length);
  });
});
