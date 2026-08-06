/**
 * In-memory mock adapter for development. Synthetic notification METADATA ONLY —
 * no email, no push, no WebSocket, no persistence. Notifications span every
 * category and reference ids from the other modules' seeds.
 */
import type {
  DeliveryStatusDto,
  NotificationCategoryDto,
  NotificationDto,
  NotificationStatusDto,
  Page,
  PreferenceDto,
  PriorityDto,
} from '../domain/dto';
import { applyNotificationQuery, type NotificationQuery } from '../domain/query';
import { CATEGORY_ORDER } from '../domain/mappers';
import type { NotificationRepository } from './repository';

let seq = 0;
function note(
  category: NotificationCategoryDto,
  priority: PriorityDto,
  status: NotificationStatusDto,
  delivery: DeliveryStatusDto,
  title: string,
  body: string,
  source: string,
  sourceRef: string,
  createdAt: string,
): NotificationDto {
  seq += 1;
  const n = String(seq).padStart(4, '0');
  return {
    id: `ntf-${n}`,
    category,
    priority,
    status,
    delivery,
    title,
    body,
    source,
    sourceRef,
    createdAt,
    readAt: status === 'UNREAD' ? undefined : '2026-08-02T08:00:00.000Z',
    metadata: [
      { label: 'Priority', value: priority },
      { label: 'Reference', value: sourceRef },
    ],
  };
}

const NOTIFICATIONS: readonly NotificationDto[] = [
  note(
    'RISK',
    'CRITICAL',
    'UNREAD',
    'DELIVERED',
    'Risk review blocked',
    'WFC-47 escalated to committee for FX carry candidate.',
    'risk-service',
    'workflow:WFC-47',
    '2026-08-02T07:55:00.000Z',
  ),
  note(
    'EXECUTION',
    'HIGH',
    'UNREAD',
    'DELIVERED',
    'Execution rejected',
    'FX carry candidate rejected on liquidity floor.',
    'execution-governance',
    'execution:exec-fx-rejected',
    '2026-08-02T07:40:00.000Z',
  ),
  note(
    'DATASET',
    'HIGH',
    'UNREAD',
    'DELIVERED',
    'Dataset quarantined',
    'Credit Spreads moved to QUARANTINED (look-ahead detected).',
    'dataset-service',
    'dataset:ds-credit-spreads',
    '2026-08-01T12:00:00.000Z',
  ),
  note(
    'AGENT',
    'HIGH',
    'UNREAD',
    'PENDING',
    'Agent suspended',
    'Engineering agent suspended by drift monitor.',
    'monitoring-service',
    'agent:EN-001',
    '2026-07-25T12:00:00.000Z',
  ),
  note(
    'VALIDATION',
    'NORMAL',
    'READ',
    'DELIVERED',
    'Validation passed',
    'Reversal signal cleared the validation gauntlet.',
    'validation-service',
    'signal:sig-reversal',
    '2026-05-30T00:00:00.000Z',
  ),
  note(
    'WORKFLOW',
    'NORMAL',
    'READ',
    'DELIVERED',
    'Workflow completed',
    'Validation workflow WFC-46 completed.',
    'workflow-engine',
    'workflow:WFC-46',
    '2026-08-01T10:30:00.000Z',
  ),
  note(
    'MONITORING',
    'NORMAL',
    'UNREAD',
    'DELIVERED',
    'Service degraded',
    'portfolio-service latency elevated.',
    'monitoring-service',
    'service:portfolio-service',
    '2026-08-02T06:30:00.000Z',
  ),
  note(
    'GOVERNANCE',
    'HIGH',
    'READ',
    'DELIVERED',
    'Governance sign-off',
    'Reversal long/short approved for portfolio construction.',
    'admin-web',
    'strategy:str-reversal-ls',
    '2026-06-12T00:00:00.000Z',
  ),
  note(
    'STRATEGY',
    'NORMAL',
    'READ',
    'DELIVERED',
    'Strategy approved',
    'Reversal long/short approved.',
    'strategy-service',
    'strategy:str-reversal-ls',
    '2026-06-12T00:00:00.000Z',
  ),
  note(
    'PORTFOLIO',
    'NORMAL',
    'READ',
    'DELIVERED',
    'Portfolio snapshot',
    'Core multi-strategy snapshot registered.',
    'portfolio-service',
    'portfolio:port-core',
    '2026-07-01T00:00:00.000Z',
  ),
  note(
    'FEATURE',
    'LOW',
    'READ',
    'DELIVERED',
    'Feature approved',
    'Residual return (1d) approved into the marketplace.',
    'feature-service',
    'feature:feat-resid-return',
    '2026-05-18T00:00:00.000Z',
  ),
  note(
    'SIGNAL',
    'LOW',
    'ARCHIVED',
    'DELIVERED',
    'Signal retired',
    'Credit momentum signal retired after refuted research.',
    'signal-service',
    'signal:sig-credit-mom',
    '2026-06-30T00:00:00.000Z',
  ),
  note(
    'EXPERIMENT',
    'LOW',
    'READ',
    'DELIVERED',
    'Experiment concluded',
    'Cross-sectional credit momentum concluded (refuted).',
    'research-service',
    'experiment:exp-credit-momentum',
    '2026-06-30T00:00:00.000Z',
  ),
  note(
    'RESEARCH',
    'NORMAL',
    'UNREAD',
    'DELIVERED',
    'New hypothesis proposed',
    'RD-001 proposed 4 new hypotheses.',
    'research-service',
    'agent:RD-001',
    '2026-08-01T00:00:00.000Z',
  ),
  note(
    'SYSTEM',
    'LOW',
    'READ',
    'FAILED',
    'Digest delivery failed',
    'Weekly digest could not be delivered (channel unavailable).',
    'notification-service',
    'system:digest',
    '2026-08-02T05:00:00.000Z',
  ),
];

const PREFERENCES: readonly PreferenceDto[] = CATEGORY_ORDER.map((category) => ({
  category,
  inApp: true,
  digest: category === 'SYSTEM' || category === 'MONITORING' ? false : true,
}));

const BY_ID = new Map(
  NOTIFICATIONS.map((notification) => [notification.id, notification] as const),
);

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockNotificationRepository implements NotificationRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: NotificationQuery): Promise<Page<NotificationDto>> {
    await this.delay();
    return applyNotificationQuery(NOTIFICATIONS, query);
  }

  async getById(id: string): Promise<NotificationDto | null> {
    await this.delay();
    return BY_ID.get(id) ?? null;
  }

  async all(): Promise<readonly NotificationDto[]> {
    await this.delay();
    return NOTIFICATIONS;
  }

  async listPreferences(): Promise<readonly PreferenceDto[]> {
    await this.delay();
    return PREFERENCES;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const NOTIFICATION_SEED = {
  notifications: NOTIFICATIONS,
  preferences: PREFERENCES,
} as const;
