import { describe, it, expect } from 'vitest';
import { applyConnectorQuery } from '../src/modules/connector/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/connector/domain/mappers';
import { connectorFactory, CONNECTOR_TYPE_ORDER } from '../src/modules/connector/domain/catalog';
import { ConnectorService } from '../src/modules/connector/application/connector-service';
import {
  CONNECTOR_SEED,
  MockConnectorRepository,
} from '../src/modules/connector/data/mock-repository';

describe('applyConnectorQuery (pure filter/sort/search)', () => {
  it('filters by type', () => {
    const ai = applyConnectorQuery(CONNECTOR_SEED, { type: 'AI_PROVIDER' });
    expect(ai.length).toBeGreaterThan(0);
    expect(ai.every((c) => c.type === 'AI_PROVIDER')).toBe(true);
  });

  it('filters by status', () => {
    const enabled = applyConnectorQuery(CONNECTOR_SEED, { status: 'ENABLED' });
    expect(enabled.every((c) => c.status === 'ENABLED')).toBe(true);
  });

  it('searches across name, provider, owner and tags', () => {
    const result = applyConnectorQuery(CONNECTOR_SEED, { search: 'binance' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('CN-BINANCE');
  });

  it('sorts by name ascending', () => {
    const sorted = applyConnectorQuery(CONNECTOR_SEED, { sortBy: 'name', sortDir: 'asc' });
    const names = sorted.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('connector mappers (pure DTO → VM)', () => {
  const binance = CONNECTOR_SEED.find((c) => c.id === 'CN-BINANCE')!;

  it('maps a list item with tones and labels', () => {
    const vm = toListItemVm(binance);
    expect(vm.status.tone).toBe('positive');
    expect(vm.type.label).toBe('Exchange API');
    expect(vm.health.label).toBe('Healthy');
    expect(vm.updatedLabel).toBe('2026-08-01');
  });

  it('never exposes secret configuration values in the detail VM', () => {
    const vm = toDetailVm(binance);
    const secretField = vm.configuration.fields.find((f) => f.secret);
    expect(secretField).toBeDefined();
    expect(secretField!.value).not.toContain('vault://');
    expect(secretField!.value.toLowerCase()).toContain('secrets broker');
  });

  it('builds the lifecycle timeline with a single current step for in-progress connectors', () => {
    const gemini = CONNECTOR_SEED.find((c) => c.id === 'CN-GEMINI')!;
    const vm = toDetailVm(gemini);
    expect(vm.lifecycle.filter((s) => s.state === 'current')).toHaveLength(1);
  });

  it('summarizes counts, status buckets and type buckets', () => {
    const summary = toSummaryVm(CONNECTOR_SEED);
    expect(summary.total).toBe(CONNECTOR_SEED.length);
    expect(summary.enabled).toBe(CONNECTOR_SEED.filter((c) => c.status === 'ENABLED').length);
    expect(summary.byStatus.every((b) => b.count > 0)).toBe(true);
    expect(summary.byType.every((b) => b.count > 0)).toBe(true);
  });
});

describe('connector factory (type catalog abstraction)', () => {
  it('describes every supported connector type', () => {
    expect(connectorFactory.listTypes()).toHaveLength(CONNECTOR_TYPE_ORDER.length);
    expect(connectorFactory.describe('AI_PROVIDER').label).toBe('AI provider');
  });
});

describe('ConnectorService (over the mock repository)', () => {
  const service = new ConnectorService(new MockConnectorRepository());

  it('lists connectors as view models', async () => {
    const list = await service.listConnectors();
    expect(list).toHaveLength(CONNECTOR_SEED.length);
  });

  it('gets a connector detail by id and null for unknown', async () => {
    expect(await service.getConnector('CN-OPENAI')).not.toBeNull();
    expect(await service.getConnector('does-not-exist')).toBeNull();
  });

  it('exposes the connector-type catalog', () => {
    expect(service.listConnectorTypes()).toHaveLength(CONNECTOR_TYPE_ORDER.length);
  });

  it('computes the dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(CONNECTOR_SEED.length);
  });
});
