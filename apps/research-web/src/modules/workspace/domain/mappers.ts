/**
 * DTO → view-model mappings. All presentation decisions (labels, tones, hrefs,
 * date formatting) live here so UI components stay logic-free. Pure and
 * deterministic. Cross-module hrefs point at the existing research-web routes.
 */
import type {
  ActivityDto,
  PreferencesDto,
  SavedViewDto,
  StatusLevelDto,
  SummaryDto,
  WorkspaceItemDto,
  WorkspaceItemKindDto,
  WorkspaceNotificationDto,
} from './dto';
import type {
  ActivityVm,
  MetadataRowVm,
  NotificationVm,
  SavedViewVm,
  SummaryStatVm,
  Tone,
  WorkspaceItemVm,
} from './view-model';

const KIND_LABEL: Record<WorkspaceItemKindDto, string> = {
  DATASET: 'Dataset',
  EXPERIMENT: 'Experiment',
  FEATURE: 'Feature',
  SIGNAL: 'Signal',
  STRATEGY: 'Strategy',
  PORTFOLIO: 'Portfolio',
};

/** Route base per artifact kind (the existing research-web module routes). */
const KIND_ROUTE: Record<WorkspaceItemKindDto, string> = {
  DATASET: '/datasets',
  EXPERIMENT: '/experiments',
  FEATURE: '/features',
  SIGNAL: '/signals',
  STRATEGY: '/strategies',
  PORTFOLIO: '/portfolios',
};

const LEVEL_TONE: Record<StatusLevelDto, Tone> = {
  OK: 'positive',
  WARN: 'warning',
  ERROR: 'danger',
  INFO: 'info',
  NEUTRAL: 'neutral',
};

const PRIORITY_LABEL: Record<WorkspaceNotificationDto['priority'], string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const PRIORITY_TONE: Record<WorkspaceNotificationDto['priority'], Tone> = {
  LOW: 'neutral',
  NORMAL: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

export function kindLabel(kind: WorkspaceItemKindDto): string {
  return KIND_LABEL[kind];
}

export function kindRoute(kind: WorkspaceItemKindDto): string {
  return KIND_ROUTE[kind];
}

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

function itemHref(kind: WorkspaceItemKindDto, id: string): string {
  return `${KIND_ROUTE[kind]}/${id}`;
}

export function toItemVm(item: WorkspaceItemDto): WorkspaceItemVm {
  return {
    kind: item.kind,
    kindLabel: KIND_LABEL[item.kind],
    id: item.id,
    name: item.name,
    status: { value: item.level, label: item.statusLabel, tone: LEVEL_TONE[item.level] },
    updatedLabel: dateLabel(item.updatedAt),
    href: itemHref(item.kind, item.id),
  };
}

export function toActivityVm(activity: ActivityDto): ActivityVm {
  return {
    id: activity.id,
    actor: activity.actor,
    action: activity.action,
    itemName: activity.itemName,
    href: itemHref(activity.itemKind, activity.itemId),
    occurredLabel: dateLabel(activity.occurredAt),
  };
}

export function toSavedViewVm(view: SavedViewDto): SavedViewVm {
  return {
    id: view.id,
    name: view.name,
    description: view.description,
    kindLabel: KIND_LABEL[view.kind],
    filterLabel: view.filterLabel,
    href: KIND_ROUTE[view.kind],
  };
}

export function toNotificationVm(notification: WorkspaceNotificationDto): NotificationVm {
  return {
    id: notification.id,
    title: notification.title,
    categoryLabel: notification.category,
    priority: {
      value: notification.priority,
      label: PRIORITY_LABEL[notification.priority],
      tone: PRIORITY_TONE[notification.priority],
    },
    createdLabel: dateLabel(notification.createdAt),
  };
}

export function toPreferenceRows(preferences: PreferencesDto): MetadataRowVm[] {
  return [
    { label: 'Default landing', value: preferences.defaultLanding },
    { label: 'Density', value: preferences.density === 'COMPACT' ? 'Compact' : 'Comfortable' },
    {
      label: 'Pinned modules',
      value: preferences.pinnedModules.map((kind) => KIND_LABEL[kind]).join(', ') || '—',
    },
  ];
}

export function toSummaryStats(summary: SummaryDto): SummaryStatVm[] {
  return [
    {
      key: 'active-experiments',
      label: 'Active experiments',
      value: summary.activeExperiments,
      href: '/experiments',
    },
    { key: 'datasets', label: 'Datasets', value: summary.datasets, href: '/datasets' },
    { key: 'features', label: 'Features', value: summary.features, href: '/features' },
    { key: 'signals', label: 'Signals', value: summary.signals, href: '/signals' },
    { key: 'strategies', label: 'Strategies', value: summary.strategies, href: '/strategies' },
    { key: 'portfolios', label: 'Portfolios', value: summary.portfolios, href: '/portfolios' },
  ];
}
