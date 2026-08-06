/**
 * In-memory mock adapter for development. Synthetic workspace METADATA ONLY — no
 * quantitative algorithms, no persistence. Item references use ids from the other
 * research modules' seeds so cross-links resolve within research-web.
 */
import type {
  ActivityDto,
  PreferencesDto,
  QuickActionDto,
  SavedViewDto,
  SummaryDto,
  WorkspaceItemDto,
  WorkspaceItemKindDto,
  WorkspaceNotificationDto,
} from '../domain/dto';
import type { WorkspaceRepository } from './repository';

function item(
  kind: WorkspaceItemKindDto,
  id: string,
  name: string,
  statusLabel: string,
  level: WorkspaceItemDto['level'],
  updatedAt: string,
): WorkspaceItemDto {
  return { kind, id, name, statusLabel, level, updatedAt };
}

const DATASETS: readonly WorkspaceItemDto[] = [
  item(
    'DATASET',
    'ds-equity-eod',
    'US Equity Prices (EOD)',
    'Certified',
    'OK',
    '2026-07-28T00:00:00.000Z',
  ),
  item('DATASET', 'ds-fx-spot', 'FX Spot Rates', 'Ingested', 'INFO', '2026-07-29T00:00:00.000Z'),
  item(
    'DATASET',
    'ds-credit-spreads',
    'Credit Spreads',
    'Quarantined',
    'ERROR',
    '2026-07-15T00:00:00.000Z',
  ),
];

const EXPERIMENTS: readonly WorkspaceItemDto[] = [
  item(
    'EXPERIMENT',
    'exp-momentum-reversal',
    'Short-horizon reversal in US equities',
    'Under validation',
    'WARN',
    '2026-07-27T00:00:00.000Z',
  ),
  item(
    'EXPERIMENT',
    'exp-rates-value',
    'Curve value in government rates',
    'Running',
    'INFO',
    '2026-07-29T00:00:00.000Z',
  ),
  item(
    'EXPERIMENT',
    'exp-carry-fx',
    'FX carry with crowding adjustment',
    'Under review',
    'WARN',
    '2026-07-22T00:00:00.000Z',
  ),
];

const FEATURES: readonly WorkspaceItemDto[] = [
  item(
    'FEATURE',
    'feat-resid-return',
    'Residual return (1d)',
    'Approved',
    'OK',
    '2026-07-26T00:00:00.000Z',
  ),
  item(
    'FEATURE',
    'feat-carry',
    'Carry signal',
    'Under validation',
    'WARN',
    '2026-07-22T00:00:00.000Z',
  ),
];

const SIGNALS: readonly WorkspaceItemDto[] = [
  item('SIGNAL', 'sig-reversal', 'Reversal signal', 'Approved', 'OK', '2026-07-26T00:00:00.000Z'),
  item(
    'SIGNAL',
    'sig-fx-carry',
    'FX carry signal',
    'Under validation',
    'WARN',
    '2026-07-22T00:00:00.000Z',
  ),
];

const STRATEGIES: readonly WorkspaceItemDto[] = [
  item(
    'STRATEGY',
    'str-reversal-ls',
    'Reversal long/short',
    'Approved',
    'OK',
    '2026-07-27T00:00:00.000Z',
  ),
  item(
    'STRATEGY',
    'str-multi-equity',
    'Multi-signal equity',
    'Under review',
    'WARN',
    '2026-07-29T00:00:00.000Z',
  ),
];

const PORTFOLIOS: readonly WorkspaceItemDto[] = [
  item(
    'PORTFOLIO',
    'port-core',
    'Core multi-strategy',
    'Approved',
    'OK',
    '2026-07-27T00:00:00.000Z',
  ),
  item(
    'PORTFOLIO',
    'port-equity-mn',
    'Equity market-neutral',
    'Under review',
    'WARN',
    '2026-07-29T00:00:00.000Z',
  ),
];

const RECENT: Record<WorkspaceItemKindDto, readonly WorkspaceItemDto[]> = {
  DATASET: DATASETS,
  EXPERIMENT: EXPERIMENTS,
  FEATURE: FEATURES,
  SIGNAL: SIGNALS,
  STRATEGY: STRATEGIES,
  PORTFOLIO: PORTFOLIOS,
};

const FAVORITES: readonly WorkspaceItemDto[] = [EXPERIMENTS[0]!, STRATEGIES[0]!, DATASETS[0]!];

const BOOKMARKS: readonly WorkspaceItemDto[] = [SIGNALS[0]!, PORTFOLIOS[0]!, FEATURES[0]!];

const ACTIVITY: readonly ActivityDto[] = [
  {
    id: 'act-1',
    actor: 'Ada Researcher',
    action: 'proposed hypothesis for',
    itemKind: 'EXPERIMENT',
    itemId: 'exp-momentum-reversal',
    itemName: 'Short-horizon reversal',
    occurredAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'act-2',
    actor: 'Validation',
    action: 'passed validation for',
    itemKind: 'SIGNAL',
    itemId: 'sig-reversal',
    itemName: 'Reversal signal',
    occurredAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'act-3',
    actor: 'Data Engineering',
    action: 'quarantined',
    itemKind: 'DATASET',
    itemId: 'ds-credit-spreads',
    itemName: 'Credit Spreads',
    occurredAt: '2026-07-15T00:00:00.000Z',
  },
  {
    id: 'act-4',
    actor: 'Scientific Governance',
    action: 'approved',
    itemKind: 'STRATEGY',
    itemId: 'str-reversal-ls',
    itemName: 'Reversal long/short',
    occurredAt: '2026-06-12T00:00:00.000Z',
  },
];

const SAVED_VIEWS: readonly SavedViewDto[] = [
  {
    id: 'sv-1',
    name: 'My approved signals',
    description: 'Signals I own that are approved.',
    kind: 'SIGNAL',
    filterLabel: 'status = Approved',
  },
  {
    id: 'sv-2',
    name: 'Equity experiments',
    description: 'Experiments in the equity universe.',
    kind: 'EXPERIMENT',
    filterLabel: 'assetClass = Equity',
  },
  {
    id: 'sv-3',
    name: 'Certified datasets',
    description: 'Datasets ready for research.',
    kind: 'DATASET',
    filterLabel: 'status = Certified',
  },
];

const PREFERENCES: PreferencesDto = {
  defaultLanding: 'Workspace',
  density: 'COMFORTABLE',
  pinnedModules: ['EXPERIMENT', 'SIGNAL', 'STRATEGY'],
};

const NOTIFICATIONS: readonly WorkspaceNotificationDto[] = [
  {
    id: 'wn-1',
    title: 'FX carry candidate rejected on risk',
    category: 'Execution',
    priority: 'HIGH',
    createdAt: '2026-08-02T07:40:00.000Z',
  },
  {
    id: 'wn-2',
    title: 'Credit Spreads dataset quarantined',
    category: 'Dataset',
    priority: 'HIGH',
    createdAt: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'wn-3',
    title: 'Reversal signal passed validation',
    category: 'Validation',
    priority: 'NORMAL',
    createdAt: '2026-05-30T00:00:00.000Z',
  },
];

const QUICK_ACTIONS: readonly QuickActionDto[] = [
  { id: 'qa-experiments', label: 'Browse experiments', href: '/experiments' },
  { id: 'qa-datasets', label: 'Browse datasets', href: '/datasets' },
  { id: 'qa-signals', label: 'Browse signals', href: '/signals' },
  { id: 'qa-strategies', label: 'Browse strategies', href: '/strategies' },
  { id: 'qa-profile', label: 'Your profile', href: '/profile' },
];

const SUMMARY: SummaryDto = {
  activeExperiments: EXPERIMENTS.length,
  datasets: DATASETS.length,
  features: FEATURES.length,
  signals: SIGNALS.length,
  strategies: STRATEGIES.length,
  portfolios: PORTFOLIOS.length,
};

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockWorkspaceRepository implements WorkspaceRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async getSummary(): Promise<SummaryDto> {
    await this.delay();
    return SUMMARY;
  }

  async recentByKind(kind: WorkspaceItemKindDto): Promise<readonly WorkspaceItemDto[]> {
    await this.delay();
    return RECENT[kind];
  }

  async activeExperiments(): Promise<readonly WorkspaceItemDto[]> {
    await this.delay();
    return EXPERIMENTS;
  }

  async favorites(): Promise<readonly WorkspaceItemDto[]> {
    await this.delay();
    return FAVORITES;
  }

  async bookmarks(): Promise<readonly WorkspaceItemDto[]> {
    await this.delay();
    return BOOKMARKS;
  }

  async activity(): Promise<readonly ActivityDto[]> {
    await this.delay();
    return ACTIVITY;
  }

  async savedViews(): Promise<readonly SavedViewDto[]> {
    await this.delay();
    return SAVED_VIEWS;
  }

  async preferences(): Promise<PreferencesDto> {
    await this.delay();
    return PREFERENCES;
  }

  async notifications(): Promise<readonly WorkspaceNotificationDto[]> {
    await this.delay();
    return NOTIFICATIONS;
  }

  async quickActions(): Promise<readonly QuickActionDto[]> {
    await this.delay();
    return QUICK_ACTIONS;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const WORKSPACE_SEED = {
  summary: SUMMARY,
  recent: RECENT,
  favorites: FAVORITES,
  bookmarks: BOOKMARKS,
  activity: ACTIVITY,
  savedViews: SAVED_VIEWS,
  preferences: PREFERENCES,
  notifications: NOTIFICATIONS,
  quickActions: QUICK_ACTIONS,
} as const;
