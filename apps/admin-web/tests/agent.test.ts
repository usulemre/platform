import { describe, it, expect } from 'vitest';
import { applyAgentQuery } from '../src/modules/agent/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/agent/domain/mappers';
import { AgentService } from '../src/modules/agent/application/agent-service';
import { AGENT_SEED, MockAgentRepository } from '../src/modules/agent/data/mock-repository';

describe('governance invariant', () => {
  it('no registered agent has DECIDES authority (AI-1..4, REG-9)', () => {
    expect(AGENT_SEED.every((agent) => agent.authority !== ('DECIDES' as string))).toBe(true);
    expect(
      AGENT_SEED.every((agent) => ['PROPOSES', 'NARRATES', 'OBSERVES'].includes(agent.authority)),
    ).toBe(true);
  });
});

describe('applyAgentQuery (pure filter/sort/search)', () => {
  it('filters by status and authority', () => {
    const active = applyAgentQuery(AGENT_SEED, { status: 'ACTIVE' });
    expect(active.every((a) => a.status === 'ACTIVE')).toBe(true);
    const narrators = applyAgentQuery(AGENT_SEED, { authority: 'NARRATES' });
    expect(narrators.every((a) => a.authority === 'NARRATES')).toBe(true);
  });

  it('searches across name, category and owner', () => {
    const results = applyAgentQuery(AGENT_SEED, { search: 'validation' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by name ascending deterministically', () => {
    const sorted = applyAgentQuery(AGENT_SEED, { sortBy: 'name', sortDir: 'asc' });
    const names = sorted.map((a) => a.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (DTO → view model)', () => {
  it('maps status/authority/health tones and a single current lifecycle step', () => {
    const active = AGENT_SEED.find((a) => a.status === 'ACTIVE');
    expect(active).toBeDefined();
    const list = toListItemVm(active!);
    expect(list.status.tone).toBe('positive');
    expect(list.authority.tone === 'info' || list.authority.tone === 'neutral').toBe(true);

    const evaluating = AGENT_SEED.find((a) => a.status === 'UNDER_EVALUATION');
    expect(evaluating).toBeDefined();
    const detail = toDetailVm(evaluating!);
    expect(detail.lifecycle.filter((step) => step.state === 'current').length).toBe(1);
    expect(detail.contracts.some((row) => row.label === 'Authority ceiling')).toBe(true);
    expect(detail.evaluation.gate.label).toBeDefined();
  });

  it('aggregates a status summary', () => {
    const summary = toSummaryVm(AGENT_SEED);
    expect(summary.total).toBe(AGENT_SEED.length);
    expect(summary.byStatus.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(AGENT_SEED.length);
  });
});

describe('AgentService (application layer over mock repository)', () => {
  const service = new AgentService(new MockAgentRepository());

  it('lists agents as view models', async () => {
    const items = await service.listAgents({});
    expect(items.length).toBe(AGENT_SEED.length);
    expect(items[0]).toHaveProperty('authority');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getAgent('RD-001');
    expect(detail?.name).toBe('Research discovery');
    expect(await service.getAgent('nope')).toBeNull();
  });

  it('computes a dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(AGENT_SEED.length);
  });
});
