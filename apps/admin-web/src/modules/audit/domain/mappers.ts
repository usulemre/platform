/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. No event storage, no computation beyond counting.
 */
import type { AuditEventDto, ChangeDto, EventCategoryDto, OutcomeDto, Page } from './dto';
import type {
  AuditEventDetailVm,
  AuditEventListItemVm,
  AuditPageVm,
  AuditSummaryVm,
  CategoryTileVm,
  MetadataRowVm,
  OutcomeBucketVm,
  PageInfoVm,
  StatusVm,
  Tone,
} from './view-model';

/** Ordered list of categories (drives the dashboard tiles). */
export const CATEGORY_ORDER: readonly EventCategoryDto[] = [
  'USER',
  'AGENT',
  'WORKFLOW',
  'EXECUTION',
  'VALIDATION',
  'DATASET',
  'EXPERIMENT',
  'FEATURE',
  'SIGNAL',
  'STRATEGY',
  'PORTFOLIO',
  'GOVERNANCE',
  'AUTH',
  'SYSTEM',
];

const CATEGORY_LABEL: Record<EventCategoryDto, string> = {
  USER: 'User',
  AGENT: 'Agent',
  WORKFLOW: 'Workflow',
  EXECUTION: 'Execution',
  VALIDATION: 'Validation',
  DATASET: 'Dataset',
  EXPERIMENT: 'Experiment',
  FEATURE: 'Feature',
  SIGNAL: 'Signal',
  STRATEGY: 'Strategy',
  PORTFOLIO: 'Portfolio',
  GOVERNANCE: 'Governance',
  AUTH: 'Auth',
  SYSTEM: 'System',
};

const OUTCOME_LABEL: Record<OutcomeDto, string> = {
  SUCCESS: 'Success',
  FAILURE: 'Failure',
  DENIED: 'Denied',
  INFO: 'Info',
};

const OUTCOME_TONE: Record<OutcomeDto, Tone> = {
  SUCCESS: 'positive',
  FAILURE: 'danger',
  DENIED: 'warning',
  INFO: 'info',
};

const OUTCOME_ORDER: readonly OutcomeDto[] = ['SUCCESS', 'INFO', 'DENIED', 'FAILURE'];

export function categoryLabel(category: EventCategoryDto): string {
  return CATEGORY_LABEL[category];
}

/** ISO → "YYYY-MM-DD HH:MM" (audit events are timestamped). */
function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function toOutcomeVm(outcome: OutcomeDto): StatusVm {
  return { value: outcome, label: OUTCOME_LABEL[outcome], tone: OUTCOME_TONE[outcome] };
}

export function toListItemVm(event: AuditEventDto): AuditEventListItemVm {
  return {
    id: event.id,
    categoryLabel: CATEGORY_LABEL[event.category],
    action: event.action,
    outcome: toOutcomeVm(event.outcome),
    actorLabel: `${event.actor.displayName} (${event.actor.kind})`,
    targetLabel: `${event.target.kind}:${event.target.name}`,
    source: event.source,
    occurredLabel: dateTimeLabel(event.occurredAt),
    correlationId: event.trace.correlationId,
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

export function toPageVm(page: Page<AuditEventDto>): AuditPageVm {
  return { items: page.items.map(toListItemVm), pageInfo: pageInfo(page) };
}

function toChangeVm(change: ChangeDto) {
  return { field: change.field, from: change.from, to: change.to };
}

export function toDetailVm(event: AuditEventDto): AuditEventDetailVm {
  const summary: MetadataRowVm[] = [
    { label: 'Category', value: CATEGORY_LABEL[event.category] },
    { label: 'Actor', value: `${event.actor.displayName} (${event.actor.kind})` },
    { label: 'Target', value: `${event.target.kind}:${event.target.name}` },
    { label: 'Source', value: event.source },
    { label: 'Occurred', value: dateTimeLabel(event.occurredAt) },
  ];
  const trace: MetadataRowVm[] = [
    { label: 'Correlation ID', value: event.trace.correlationId },
    { label: 'Request ID', value: event.trace.requestId },
    { label: 'Session ID', value: event.trace.sessionId ?? '—' },
    { label: 'Trace ID', value: event.trace.traceId },
  ];
  return {
    id: event.id,
    categoryLabel: CATEGORY_LABEL[event.category],
    action: event.action,
    outcome: toOutcomeVm(event.outcome),
    occurredLabel: dateTimeLabel(event.occurredAt),
    summary,
    trace,
    metadata: event.metadata.map((entry) => ({ label: entry.label, value: entry.value })),
    changes: event.changes.map(toChangeVm),
  };
}

export function toSummaryVm(events: readonly AuditEventDto[]): AuditSummaryVm {
  const countCategory = (category: EventCategoryDto): number =>
    events.filter((event) => event.category === category).length;
  const countOutcome = (outcome: OutcomeDto): number =>
    events.filter((event) => event.outcome === outcome).length;

  const categories: CategoryTileVm[] = CATEGORY_ORDER.map((category) => ({
    value: category,
    label: CATEGORY_LABEL[category],
    count: countCategory(category),
    href: `/audit/category/${category}`,
  }));

  const byOutcome: OutcomeBucketVm[] = OUTCOME_ORDER.map((outcome) => ({
    value: outcome,
    label: OUTCOME_LABEL[outcome],
    count: countOutcome(outcome),
    tone: OUTCOME_TONE[outcome],
  })).filter((bucket) => bucket.count > 0);

  return { total: events.length, byOutcome, categories };
}
