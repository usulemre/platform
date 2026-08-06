/**
 * Connector view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface CapabilityVm {
  readonly key: string;
  readonly label: string;
  readonly support: StatusVm;
  readonly note?: string;
}

export interface ConfigFieldVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly secret: boolean;
}

export interface ConfigurationVm {
  readonly environment: StatusVm;
  readonly configRef: string;
  readonly fields: readonly ConfigFieldVm[];
  readonly updatedLabel?: string;
}

export interface CredentialVm {
  readonly kind: string;
  readonly status: StatusVm;
  readonly secretRef: string;
  readonly rotatedLabel?: string;
}

export interface HealthVm {
  readonly status: StatusVm;
  readonly message: string;
  readonly latency: string;
  readonly uptime: string;
  readonly lastCheckedLabel: string;
}

export interface MetricsVm {
  readonly requestsToDate: string;
  readonly errorRate: string;
  readonly avgLatency: string;
  readonly rateLimit: string;
  readonly lastRequestLabel?: string;
}

export interface DiagnosticVm {
  readonly check: string;
  readonly status: StatusVm;
  readonly detail: string;
}

export interface ValidationIssueVm {
  readonly code: string;
  readonly severity: string;
  readonly message: string;
  readonly tone: Tone;
}

export interface ValidationVm {
  readonly status: string;
  readonly label: string;
  readonly tone: Tone;
  readonly issueCount: number;
  readonly issues: readonly ValidationIssueVm[];
  readonly checkedLabel?: string;
}

export interface TimelineStepVm {
  readonly stage: string;
  readonly label: string;
  readonly dateLabel?: string;
  readonly state: 'done' | 'current' | 'pending';
}

export interface ActivityEventVm {
  readonly id: string;
  readonly label: string;
  readonly actor?: string;
  readonly occurredLabel: string;
}

export interface ConnectorVersionVm {
  readonly version: string;
  readonly releasedLabel: string;
  readonly note: string;
  readonly apiVersion?: string;
}

export interface ConnectorListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly provider: string;
  readonly type: StatusVm;
  readonly status: StatusVm;
  readonly health: StatusVm;
  readonly environment: StatusVm;
  readonly owner: string;
  readonly version: string;
  readonly updatedLabel: string;
  readonly tags: readonly string[];
}

export interface ConnectorDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly provider: string;
  readonly description: string;
  readonly type: StatusVm;
  readonly typeLabel: string;
  readonly status: StatusVm;
  readonly health: StatusVm;
  readonly environment: StatusVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly configuration: ConfigurationVm;
  readonly credentials: readonly CredentialVm[];
  readonly capabilities: readonly CapabilityVm[];
  readonly healthDetail: HealthVm;
  readonly metrics: MetricsVm;
  readonly diagnostics: readonly DiagnosticVm[];
  readonly validation: ValidationVm;
  readonly lifecycle: readonly TimelineStepVm[];
  readonly activity: readonly ActivityEventVm[];
  readonly versions: readonly ConnectorVersionVm[];
  readonly tags: readonly string[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface ConnectorSummaryVm {
  readonly total: number;
  readonly enabled: number;
  readonly degraded: number;
  readonly retired: number;
  readonly byStatus: readonly SummaryBucketVm[];
  readonly byType: readonly SummaryBucketVm[];
}
