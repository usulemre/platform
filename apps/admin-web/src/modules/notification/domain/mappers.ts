/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. No delivery, no computation beyond counting.
 */
import type {
  DeliveryStatusDto,
  NotificationCategoryDto,
  NotificationDto,
  NotificationStatusDto,
  Page,
  PreferenceDto,
  PriorityDto,
} from './dto';
import type {
  CategoryTileVm,
  MetadataRowVm,
  NotificationDetailVm,
  NotificationListItemVm,
  NotificationPageVm,
  NotificationSummaryVm,
  PageInfoVm,
  PreferenceVm,
  PriorityBucketVm,
  StatusVm,
  Tone,
} from './view-model';

export const CATEGORY_ORDER: readonly NotificationCategoryDto[] = [
  'SYSTEM',
  'RESEARCH',
  'WORKFLOW',
  'EXECUTION',
  'RISK',
  'VALIDATION',
  'DATASET',
  'EXPERIMENT',
  'FEATURE',
  'SIGNAL',
  'STRATEGY',
  'PORTFOLIO',
  'MONITORING',
  'AGENT',
  'GOVERNANCE',
];

const CATEGORY_LABEL: Record<NotificationCategoryDto, string> = {
  SYSTEM: 'System',
  RESEARCH: 'Research',
  WORKFLOW: 'Workflow',
  EXECUTION: 'Execution',
  RISK: 'Risk',
  VALIDATION: 'Validation',
  DATASET: 'Dataset',
  EXPERIMENT: 'Experiment',
  FEATURE: 'Feature',
  SIGNAL: 'Signal',
  STRATEGY: 'Strategy',
  PORTFOLIO: 'Portfolio',
  MONITORING: 'Monitoring',
  AGENT: 'AI Agent',
  GOVERNANCE: 'Governance',
};

const PRIORITY_LABEL: Record<PriorityDto, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const PRIORITY_TONE: Record<PriorityDto, Tone> = {
  LOW: 'neutral',
  NORMAL: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

const PRIORITY_ORDER: readonly PriorityDto[] = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'];

const STATUS_LABEL: Record<NotificationStatusDto, string> = {
  UNREAD: 'Unread',
  READ: 'Read',
  ARCHIVED: 'Archived',
};

const STATUS_TONE: Record<NotificationStatusDto, Tone> = {
  UNREAD: 'info',
  READ: 'neutral',
  ARCHIVED: 'neutral',
};

const DELIVERY_LABEL: Record<DeliveryStatusDto, string> = {
  DELIVERED: 'Delivered',
  PENDING: 'Pending',
  FAILED: 'Failed',
};

const DELIVERY_TONE: Record<DeliveryStatusDto, Tone> = {
  DELIVERED: 'positive',
  PENDING: 'warning',
  FAILED: 'danger',
};

export function categoryLabel(category: NotificationCategoryDto): string {
  return CATEGORY_LABEL[category];
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function toPriorityVm(priority: PriorityDto): StatusVm {
  return { value: priority, label: PRIORITY_LABEL[priority], tone: PRIORITY_TONE[priority] };
}

function toStatusVm(status: NotificationStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toDeliveryVm(delivery: DeliveryStatusDto): StatusVm {
  return { value: delivery, label: DELIVERY_LABEL[delivery], tone: DELIVERY_TONE[delivery] };
}

export function toListItemVm(notification: NotificationDto): NotificationListItemVm {
  return {
    id: notification.id,
    categoryLabel: CATEGORY_LABEL[notification.category],
    priority: toPriorityVm(notification.priority),
    delivery: toDeliveryVm(notification.delivery),
    title: notification.title,
    source: notification.source,
    createdLabel: dateTimeLabel(notification.createdAt),
    isUnread: notification.status === 'UNREAD',
  };
}

function pageInfo(page: Page<unknown>): PageInfoVm {
  const totalPages = Math.max(1, Math.ceil(page.total / page.pageSize));
  return {
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
    totalPages,
    hasPrev: page.page > 1,
    hasNext: page.page < totalPages,
  };
}

export function toPageVm(page: Page<NotificationDto>): NotificationPageVm {
  return { items: page.items.map(toListItemVm), pageInfo: pageInfo(page) };
}

export function toDetailVm(notification: NotificationDto): NotificationDetailVm {
  const summary: MetadataRowVm[] = [
    { label: 'Category', value: CATEGORY_LABEL[notification.category] },
    { label: 'Source', value: notification.source },
    { label: 'Reference', value: notification.sourceRef },
    { label: 'Created', value: dateTimeLabel(notification.createdAt) },
    { label: 'Read', value: notification.readAt ? dateTimeLabel(notification.readAt) : '—' },
  ];
  return {
    id: notification.id,
    categoryLabel: CATEGORY_LABEL[notification.category],
    title: notification.title,
    body: notification.body,
    priority: toPriorityVm(notification.priority),
    status: toStatusVm(notification.status),
    delivery: toDeliveryVm(notification.delivery),
    createdLabel: dateTimeLabel(notification.createdAt),
    summary,
    metadata: notification.metadata.map((entry) => ({ label: entry.label, value: entry.value })),
  };
}

export function toSummaryVm(notifications: readonly NotificationDto[]): NotificationSummaryVm {
  const inCategory = (category: NotificationCategoryDto) =>
    notifications.filter((notification) => notification.category === category);
  const countPriority = (priority: PriorityDto) =>
    notifications.filter((notification) => notification.priority === priority).length;

  const categories: CategoryTileVm[] = CATEGORY_ORDER.map((category) => {
    const inCat = inCategory(category);
    return {
      value: category,
      label: CATEGORY_LABEL[category],
      count: inCat.length,
      unread: inCat.filter((notification) => notification.status === 'UNREAD').length,
      href: `/notifications/category/${category}`,
    };
  });

  const byPriority: PriorityBucketVm[] = PRIORITY_ORDER.map((priority) => ({
    value: priority,
    label: PRIORITY_LABEL[priority],
    count: countPriority(priority),
    tone: PRIORITY_TONE[priority],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: notifications.length,
    unread: notifications.filter((notification) => notification.status === 'UNREAD').length,
    byPriority,
    categories,
  };
}

const ENABLED: StatusVm = { value: 'ON', label: 'On', tone: 'positive' };
const DISABLED: StatusVm = { value: 'OFF', label: 'Off', tone: 'neutral' };

export function toPreferenceVm(preference: PreferenceDto): PreferenceVm {
  return {
    category: preference.category,
    categoryLabel: CATEGORY_LABEL[preference.category],
    inApp: preference.inApp ? ENABLED : DISABLED,
    digest: preference.digest ? ENABLED : DISABLED,
  };
}
