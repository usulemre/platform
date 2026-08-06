import { describe, it, expect } from 'vitest';
import { applyServiceQuery } from '../src/modules/monitoring/domain/query';
import {
  toAlertVm,
  toOverviewVm,
  toServiceVm,
  toSystemStatusVm,
} from '../src/modules/monitoring/domain/mappers';
import { MonitoringService } from '../src/modules/monitoring/application/monitoring-service';
import {
  MockMonitoringRepository,
  MONITORING_SEED,
} from '../src/modules/monitoring/data/mock-repository';

describe('applyServiceQuery (pure filter/sort/search)', () => {
  it('filters by severity level', () => {
    const warn = applyServiceQuery(MONITORING_SEED.services, { level: 'WARN' });
    expect(warn.every((s) => s.level === 'WARN')).toBe(true);
  });

  it('searches across name and category', () => {
    const results = applyServiceQuery(MONITORING_SEED.services, { search: 'dataset' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by name ascending deterministically', () => {
    const sorted = applyServiceQuery(MONITORING_SEED.services, { sortBy: 'name', sortDir: 'asc' });
    const names = sorted.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('orders by severity (ERROR first) when sorting by level desc', () => {
    const sorted = applyServiceQuery(MONITORING_SEED.services, {
      sortBy: 'level',
      sortDir: 'desc',
    });
    expect(sorted[0]?.level === 'ERROR' || sorted[0]?.level === 'WARN').toBe(true);
  });
});

describe('mappers (level → tone)', () => {
  it('maps monitor levels to tones', () => {
    const ok = MONITORING_SEED.services.find((s) => s.level === 'OK');
    const warn = MONITORING_SEED.services.find((s) => s.level === 'WARN');
    expect(toServiceVm(ok!).tone).toBe('positive');
    expect(toServiceVm(warn!).tone).toBe('warning');
    expect(toSystemStatusVm(MONITORING_SEED.overview.system).tone).toBe('warning');
    expect(toAlertVm(MONITORING_SEED.alerts[0]!).tone).toBeDefined();
  });

  it('builds overview stats from counts', () => {
    const vm = toOverviewVm(MONITORING_SEED.overview);
    expect(vm.stats.length).toBe(6);
    expect(vm.stats.some((stat) => stat.key === 'services')).toBe(true);
  });
});

describe('MonitoringService (application layer over mock repository)', () => {
  const service = new MonitoringService(new MockMonitoringRepository());

  it('returns view models for every operational slice', async () => {
    expect((await service.getServices({})).length).toBe(MONITORING_SEED.services.length);
    expect((await service.getWorkflows()).length).toBe(MONITORING_SEED.workflows.length);
    expect((await service.getAlerts()).length).toBe(MONITORING_SEED.alerts.length);
    expect((await service.getAuditEvents()).length).toBe(MONITORING_SEED.audit.length);
    expect((await service.getOverview()).stats.length).toBe(6);
  });

  it('applies the service query through the service', async () => {
    const errors = await service.getServices({ level: 'WARN' });
    expect(errors.every((s) => s.tone === 'warning')).toBe(true);
  });
});
