import { describe, it, expect } from 'vitest';
import { applyNotificationQuery } from '../src/modules/notification/domain/query';
import {
  toDetailVm,
  toPageVm,
  toPreferenceVm,
  toSummaryVm,
  CATEGORY_ORDER,
} from '../src/modules/notification/domain/mappers';
import { NotificationService } from '../src/modules/notification/application/notification-service';
import {
  MockNotificationRepository,
  NOTIFICATION_SEED,
} from '../src/modules/notification/data/mock-repository';

const { notifications, preferences } = NOTIFICATION_SEED;

describe('applyNotificationQuery (pure filter/order/paginate)', () => {
  it('filters by status, category and priority', () => {
    expect(
      applyNotificationQuery(notifications, { status: 'UNREAD', pageSize: 100 }).items.every(
        (n) => n.status === 'UNREAD',
      ),
    ).toBe(true);
    expect(
      applyNotificationQuery(notifications, { category: 'RISK', pageSize: 100 }).items.every(
        (n) => n.category === 'RISK',
      ),
    ).toBe(true);
    expect(
      applyNotificationQuery(notifications, { priority: 'CRITICAL', pageSize: 100 }).items.every(
        (n) => n.priority === 'CRITICAL',
      ),
    ).toBe(true);
  });

  it('orders by priority (CRITICAL first)', () => {
    const byPriority = applyNotificationQuery(notifications, { order: 'priority', pageSize: 100 });
    expect(byPriority.items[0]?.priority).toBe('CRITICAL');
  });

  it('paginates and clamps out-of-range pages', () => {
    const p1 = applyNotificationQuery(notifications, { pageSize: 5, page: 1 });
    expect(p1.items.length).toBe(5);
    expect(p1.total).toBe(notifications.length);
    const clamped = applyNotificationQuery(notifications, { pageSize: 5, page: 99 });
    expect(clamped.page).toBe(Math.ceil(notifications.length / 5));
  });

  it('searches title, body and source', () => {
    expect(
      applyNotificationQuery(notifications, { search: 'quarantined', pageSize: 100 }).total,
    ).toBeGreaterThan(0);
  });
});

describe('mappers + summary + preferences', () => {
  it('maps list items and flags unread', () => {
    const vm = toPageVm(applyNotificationQuery(notifications, { status: 'UNREAD', pageSize: 100 }));
    expect(vm.items.every((item) => item.isUnread)).toBe(true);
    expect(vm.items[0]?.createdLabel).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('maps detail with delivery status', () => {
    const failed = notifications.find((n) => n.delivery === 'FAILED');
    expect(failed).toBeDefined();
    const detail = toDetailVm(failed!);
    expect(detail.delivery.tone).toBe('danger');
    expect(detail.summary.some((row) => row.label === 'Reference')).toBe(true);
  });

  it('summarizes unread, priority buckets and one tile per category', () => {
    const summary = toSummaryVm(notifications);
    expect(summary.total).toBe(notifications.length);
    expect(summary.unread).toBe(notifications.filter((n) => n.status === 'UNREAD').length);
    expect(summary.categories.length).toBe(CATEGORY_ORDER.length);
  });

  it('maps preferences to On/Off view models', () => {
    const vm = toPreferenceVm(preferences[0]!);
    expect(['On', 'Off']).toContain(vm.inApp.label);
  });
});

describe('NotificationService (application layer over mock repository)', () => {
  const service = new NotificationService(new MockNotificationRepository());

  it('lists notifications as a paginated view model', async () => {
    const page = await service.listNotifications({ pageSize: 4, page: 1 });
    expect(page.items.length).toBe(4);
    expect(page.pageInfo.total).toBe(notifications.length);
  });

  it('returns detail by id or null, and preferences', async () => {
    expect((await service.getNotification('ntf-0001'))?.title).toBeDefined();
    expect(await service.getNotification('nope')).toBeNull();
    expect((await service.getPreferences()).length).toBe(preferences.length);
  });

  it('computes the dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(notifications.length);
  });
});
