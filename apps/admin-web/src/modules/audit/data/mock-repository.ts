/**
 * In-memory mock adapter for development. Synthetic audit METADATA ONLY — no
 * persistence, no event storage, no infrastructure logging. Events span every
 * category and reference ids from the other modules' seeds for traceability.
 */
import type {
  ActorKindDto,
  AuditEventDto,
  ChangeDto,
  EventCategoryDto,
  MetadataEntryDto,
  OutcomeDto,
  Page,
} from '../domain/dto';
import { applyAuditQuery, type AuditQuery } from '../domain/query';
import type { AuditRepository } from './repository';

let seq = 0;
function event(
  category: EventCategoryDto,
  action: string,
  outcome: OutcomeDto,
  actor: { id: string; displayName: string; kind: ActorKindDto },
  target: { kind: string; id: string; name: string },
  source: string,
  occurredAt: string,
  metadata: MetadataEntryDto[] = [],
  changes: ChangeDto[] = [],
): AuditEventDto {
  seq += 1;
  const n = String(seq).padStart(4, '0');
  return {
    id: `evt-${n}`,
    category,
    action,
    outcome,
    actor,
    target,
    source,
    occurredAt,
    trace: {
      correlationId: `corr-2026-${n}`,
      requestId: `req-${n}`,
      sessionId: actor.kind === 'USER' ? `sess-${actor.id}-01` : undefined,
      traceId: `trace-${n}`,
    },
    metadata,
    changes,
  };
}

const HUMAN = (id: string, name: string) => ({ id, displayName: name, kind: 'USER' as const });
const SERVICE = (name: string) => ({ id: name, displayName: name, kind: 'SERVICE' as const });
const SYSTEM = { id: 'system', displayName: 'System', kind: 'SYSTEM' as const };

const EVENTS: readonly AuditEventDto[] = [
  event(
    'AUTH',
    'Signed in',
    'SUCCESS',
    HUMAN('ada', 'Ada Researcher'),
    { kind: 'app', id: 'research-web', name: 'research-web' },
    'auth-service',
    '2026-08-02T09:01:00.000Z',
  ),
  event(
    'AUTH',
    'Login denied (bad credentials)',
    'DENIED',
    HUMAN('viv', 'Viv Viewer'),
    { kind: 'app', id: 'research-web', name: 'research-web' },
    'auth-service',
    '2026-08-02T09:05:00.000Z',
  ),
  event(
    'USER',
    'Role assigned',
    'SUCCESS',
    HUMAN('gia', 'Gia Governance'),
    { kind: 'user', id: 'ben', name: 'Ben Analyst' },
    'admin-web',
    '2026-08-02T09:10:00.000Z',
    [{ label: 'Role', value: 'RESEARCHER' }],
    [{ field: 'roles', from: '[]', to: '[RESEARCHER]' }],
  ),
  event(
    'AGENT',
    'Agent suspended (drift)',
    'FAILURE',
    SYSTEM,
    { kind: 'agent', id: 'EN-001', name: 'Engineering' },
    'monitoring-service',
    '2026-07-25T12:00:00.000Z',
    [{ label: 'Reason', value: 'behavioral drift' }],
    [{ field: 'status', from: 'ACTIVE', to: 'SUSPENDED' }],
  ),
  event(
    'AGENT',
    'Evaluation gate passed',
    'SUCCESS',
    SERVICE('evaluation-service'),
    { kind: 'agent', id: 'RD-001', name: 'Research discovery' },
    'evaluation-service',
    '2026-07-20T00:00:00.000Z',
    [{ label: 'Score', value: '0.94' }],
  ),
  event(
    'WORKFLOW',
    'Workflow started',
    'SUCCESS',
    SERVICE('workflow-engine'),
    { kind: 'workflow', id: 'WFC-46', name: 'Validation' },
    'workflow-engine',
    '2026-08-01T10:00:00.000Z',
  ),
  event(
    'WORKFLOW',
    'Workflow blocked (escalation)',
    'FAILURE',
    SERVICE('workflow-engine'),
    { kind: 'workflow', id: 'WFC-47', name: 'Risk review' },
    'workflow-engine',
    '2026-08-01T11:00:00.000Z',
  ),
  event(
    'VALIDATION',
    'Validation passed',
    'SUCCESS',
    SERVICE('validation-service'),
    { kind: 'signal', id: 'sig-reversal', name: 'Reversal signal' },
    'validation-service',
    '2026-05-30T00:00:00.000Z',
  ),
  event(
    'VALIDATION',
    'Leakage harness failed',
    'FAILURE',
    SERVICE('validation-service'),
    { kind: 'feature', id: 'feat-crowding', name: 'Crowding score' },
    'validation-service',
    '2026-07-02T00:00:00.000Z',
    [{ label: 'Code', value: 'LEAK-007' }],
  ),
  event(
    'DATASET',
    'Dataset quarantined',
    'DENIED',
    SERVICE('dataset-service'),
    { kind: 'dataset', id: 'ds-credit-spreads', name: 'Credit Spreads' },
    'dataset-service',
    '2026-07-15T00:00:00.000Z',
    [],
    [{ field: 'status', from: 'INGESTED', to: 'QUARANTINED' }],
  ),
  event(
    'EXPERIMENT',
    'Hypothesis pre-registered',
    'SUCCESS',
    HUMAN('ada', 'Ada Researcher'),
    { kind: 'experiment', id: 'exp-momentum-reversal', name: 'Short-horizon reversal' },
    'research-web',
    '2026-05-05T00:00:00.000Z',
  ),
  event(
    'FEATURE',
    'Feature approved',
    'SUCCESS',
    SERVICE('feature-service'),
    { kind: 'feature', id: 'feat-resid-return', name: 'Residual return (1d)' },
    'feature-service',
    '2026-05-18T00:00:00.000Z',
  ),
  event(
    'SIGNAL',
    'Signal approved (paper)',
    'SUCCESS',
    SERVICE('signal-service'),
    { kind: 'signal', id: 'sig-reversal', name: 'Reversal signal' },
    'signal-service',
    '2026-05-30T00:00:00.000Z',
  ),
  event(
    'STRATEGY',
    'Strategy approved for portfolio',
    'SUCCESS',
    SERVICE('strategy-service'),
    { kind: 'strategy', id: 'str-reversal-ls', name: 'Reversal long/short' },
    'strategy-service',
    '2026-06-12T00:00:00.000Z',
  ),
  event(
    'PORTFOLIO',
    'Portfolio snapshot registered',
    'SUCCESS',
    SERVICE('portfolio-service'),
    { kind: 'portfolio', id: 'port-core', name: 'Core multi-strategy' },
    'portfolio-service',
    '2026-07-01T00:00:00.000Z',
  ),
  event(
    'EXECUTION',
    'Authorization token issued',
    'SUCCESS',
    SERVICE('execution-governance'),
    { kind: 'execution', id: 'exec-core-paper', name: 'Core multi-strategy paper' },
    'execution-governance',
    '2026-07-29T00:00:00.000Z',
    [
      { label: 'Mode', value: 'PAPER' },
      { label: 'Token', value: 'AUTH-2026-0731-CORE' },
    ],
  ),
  event(
    'EXECUTION',
    'Execution rejected (risk)',
    'DENIED',
    SERVICE('execution-governance'),
    { kind: 'execution', id: 'exec-fx-rejected', name: 'FX carry candidate' },
    'execution-governance',
    '2026-07-29T00:00:00.000Z',
  ),
  event(
    'GOVERNANCE',
    'Scientific governance sign-off',
    'SUCCESS',
    HUMAN('gia', 'Gia Governance'),
    { kind: 'strategy', id: 'str-reversal-ls', name: 'Reversal long/short' },
    'admin-web',
    '2026-06-12T00:00:00.000Z',
    [{ label: 'Gate', value: 'Pre-capital' }],
  ),
  event(
    'GOVERNANCE',
    'Risk exception rejected',
    'DENIED',
    HUMAN('gia', 'Gia Governance'),
    { kind: 'exception', id: 'EXC-021', name: 'Bypass paper-first' },
    'admin-web',
    '2026-07-29T00:00:00.000Z',
  ),
  event(
    'SYSTEM',
    'Drift monitor run',
    'INFO',
    SYSTEM,
    { kind: 'system', id: 'drift-monitor', name: 'Drift monitor' },
    'monitoring-service',
    '2026-08-02T06:00:00.000Z',
  ),
];

const BY_ID = new Map(EVENTS.map((e) => [e.id, e] as const));

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockAuditRepository implements AuditRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: AuditQuery): Promise<Page<AuditEventDto>> {
    await this.delay();
    return applyAuditQuery(EVENTS, query);
  }

  async getById(id: string): Promise<AuditEventDto | null> {
    await this.delay();
    return BY_ID.get(id) ?? null;
  }

  async all(): Promise<readonly AuditEventDto[]> {
    await this.delay();
    return EVENTS;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const AUDIT_SEED = EVENTS;
