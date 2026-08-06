import { describe, it, expect } from 'vitest';
import {
  kindLabel,
  kindRoute,
  toActivityVm,
  toItemVm,
  toNotificationVm,
  toPreferenceRows,
  toSavedViewVm,
  toSummaryStats,
} from '../src/modules/workspace/domain/mappers';
import { WorkspaceService } from '../src/modules/workspace/application/workspace-service';
import {
  MockWorkspaceRepository,
  WORKSPACE_SEED,
} from '../src/modules/workspace/data/mock-repository';

describe('workspace mappers (pure DTO → VM)', () => {
  it('maps an item with tone, kind label and a cross-module href', () => {
    const vm = toItemVm({
      kind: 'DATASET',
      id: 'ds-equity-eod',
      name: 'US Equity Prices (EOD)',
      statusLabel: 'Certified',
      level: 'OK',
      updatedAt: '2026-07-28T12:34:56.000Z',
    });
    expect(vm.kindLabel).toBe('Dataset');
    expect(vm.href).toBe('/datasets/ds-equity-eod');
    expect(vm.status.tone).toBe('positive');
    expect(vm.updatedLabel).toBe('2026-07-28');
  });

  it('maps every status level to a distinct tone', () => {
    const tones = (['OK', 'WARN', 'ERROR', 'INFO', 'NEUTRAL'] as const).map(
      (level) =>
        toItemVm({
          kind: 'SIGNAL',
          id: 's',
          name: 'n',
          statusLabel: 'x',
          level,
          updatedAt: '2026-01-01T00:00:00.000Z',
        }).status.tone,
    );
    expect(tones).toEqual(['positive', 'warning', 'danger', 'info', 'neutral']);
  });

  it('routes activity to the artifact that owns it', () => {
    const vm = toActivityVm(WORKSPACE_SEED.activity[0]!);
    expect(vm.href).toBe('/experiments/exp-momentum-reversal');
    expect(vm.occurredLabel).toBe('2026-08-01');
  });

  it('maps a saved view to its module list route', () => {
    const vm = toSavedViewVm(WORKSPACE_SEED.savedViews[0]!);
    expect(vm.kindLabel).toBe('Signal');
    expect(vm.href).toBe('/signals');
  });

  it('maps notification priority to label + tone', () => {
    const vm = toNotificationVm(WORKSPACE_SEED.notifications[0]!);
    expect(vm.priority.label).toBe('High');
    expect(vm.priority.tone).toBe('warning');
  });

  it('flattens preferences into labelled rows', () => {
    const rows = toPreferenceRows(WORKSPACE_SEED.preferences);
    expect(rows.map((row) => row.label)).toEqual(['Default landing', 'Density', 'Pinned modules']);
    expect(rows[1]!.value).toBe('Comfortable');
    expect(rows[2]!.value).toBe('Experiment, Signal, Strategy');
  });

  it('builds six summary stat cards that deep-link into modules', () => {
    const stats = toSummaryStats(WORKSPACE_SEED.summary);
    expect(stats).toHaveLength(6);
    expect(stats.map((stat) => stat.href)).toEqual([
      '/experiments',
      '/datasets',
      '/features',
      '/signals',
      '/strategies',
      '/portfolios',
    ]);
  });

  it('exposes kind label/route helpers', () => {
    expect(kindLabel('PORTFOLIO')).toBe('Portfolio');
    expect(kindRoute('PORTFOLIO')).toBe('/portfolios');
  });
});

describe('WorkspaceService (over the mock repository)', () => {
  const service = new WorkspaceService(new MockWorkspaceRepository());

  it('returns recent items per kind as view models', async () => {
    const datasets = await service.getRecent('DATASET');
    expect(datasets).toHaveLength(3);
    expect(datasets.every((item) => item.href.startsWith('/datasets/'))).toBe(true);
  });

  it('returns active experiments', async () => {
    const experiments = await service.getActiveExperiments();
    expect(experiments).toHaveLength(3);
    expect(experiments[0]!.kindLabel).toBe('Experiment');
  });

  it('returns favorites, bookmarks and activity', async () => {
    expect(await service.getFavorites()).toHaveLength(3);
    expect(await service.getBookmarks()).toHaveLength(3);
    const activity = await service.getActivity();
    expect(activity[0]!.href).toBe('/experiments/exp-momentum-reversal');
  });

  it('returns saved views, preferences, notifications and quick actions', async () => {
    expect(await service.getSavedViews()).toHaveLength(3);
    expect(await service.getPreferences()).toHaveLength(3);
    expect(await service.getNotifications()).toHaveLength(3);
    const actions = await service.getQuickActions();
    expect(actions.map((action) => action.href)).toContain('/profile');
  });

  it('summarizes counts consistent with the recent seeds', async () => {
    const stats = await service.getSummary();
    const byKey = Object.fromEntries(stats.map((stat) => [stat.key, stat.value]));
    expect(byKey['datasets']).toBe(3);
    expect(byKey['active-experiments']).toBe(3);
  });
});
