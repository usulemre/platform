import { describe, it, expect } from 'vitest';
import { applyAuditQuery } from '../src/modules/audit/domain/query';
import {
  toDetailVm,
  toPageVm,
  toSummaryVm,
  CATEGORY_ORDER,
} from '../src/modules/audit/domain/mappers';
import { AuditService } from '../src/modules/audit/application/audit-service';
import { MockAuditRepository, AUDIT_SEED } from '../src/modules/audit/data/mock-repository';

describe('applyAuditQuery (pure filter/order/paginate)', () => {
  it('orders newest-first by default and oldest-first on request', () => {
    const newest = applyAuditQuery(AUDIT_SEED, { pageSize: 100 });
    const oldest = applyAuditQuery(AUDIT_SEED, { pageSize: 100, order: 'oldest' });
    expect(newest.items[0]?.occurredAt >= newest.items[1]!.occurredAt).toBe(true);
    expect(oldest.items[0]?.occurredAt <= oldest.items[1]!.occurredAt).toBe(true);
  });

  it('paginates and clamps out-of-range pages', () => {
    const p1 = applyAuditQuery(AUDIT_SEED, { pageSize: 5, page: 1 });
    expect(p1.items.length).toBe(5);
    expect(p1.total).toBe(AUDIT_SEED.length);
    const clamped = applyAuditQuery(AUDIT_SEED, { pageSize: 5, page: 999 });
    expect(clamped.page).toBe(Math.ceil(AUDIT_SEED.length / 5));
  });

  it('filters by category and outcome', () => {
    expect(
      applyAuditQuery(AUDIT_SEED, { category: 'EXECUTION', pageSize: 100 }).items.every(
        (e) => e.category === 'EXECUTION',
      ),
    ).toBe(true);
    expect(
      applyAuditQuery(AUDIT_SEED, { outcome: 'DENIED', pageSize: 100 }).items.every(
        (e) => e.outcome === 'DENIED',
      ),
    ).toBe(true);
  });

  it('searches across action, actor, target and trace ids', () => {
    const byId = applyAuditQuery(AUDIT_SEED, { search: 'corr-2026-0001', pageSize: 100 });
    expect(byId.total).toBe(1);
    expect(applyAuditQuery(AUDIT_SEED, { search: 'ada', pageSize: 100 }).total).toBeGreaterThan(0);
  });
});

describe('mappers + summary', () => {
  it('maps events to list view models with datetime labels', () => {
    const vm = toPageVm(applyAuditQuery(AUDIT_SEED, { pageSize: 3 }));
    expect(vm.items.length).toBe(3);
    expect(vm.items[0]?.occurredLabel).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('maps event detail with trace ids and change history', () => {
    const withChange = AUDIT_SEED.find((e) => e.changes.length > 0);
    expect(withChange).toBeDefined();
    const detail = toDetailVm(withChange!);
    expect(detail.trace.some((row) => row.label === 'Correlation ID')).toBe(true);
    expect(detail.changes.length).toBeGreaterThan(0);
  });

  it('summarizes totals, outcomes and one tile per category', () => {
    const summary = toSummaryVm(AUDIT_SEED);
    expect(summary.total).toBe(AUDIT_SEED.length);
    expect(summary.categories.length).toBe(CATEGORY_ORDER.length);
    expect(summary.categories.every((tile) => tile.href.startsWith('/audit/category/'))).toBe(true);
  });
});

describe('AuditService (application layer over mock repository)', () => {
  const service = new AuditService(new MockAuditRepository());

  it('lists events as a paginated view model', async () => {
    const page = await service.listEvents({ pageSize: 4, page: 1 });
    expect(page.items.length).toBe(4);
    expect(page.pageInfo.total).toBe(AUDIT_SEED.length);
  });

  it('returns event detail by id or null', async () => {
    const detail = await service.getEvent('evt-0001');
    expect(detail?.action).toBeDefined();
    expect(await service.getEvent('nope')).toBeNull();
  });

  it('computes the dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(AUDIT_SEED.length);
  });
});
