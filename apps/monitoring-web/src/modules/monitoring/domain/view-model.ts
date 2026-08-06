/**
 * Monitoring view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface SystemStatusVm {
  readonly statusLabel: string;
  readonly tone: Tone;
  readonly message: string;
  readonly updatedLabel: string;
}

export interface StatCardVm {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}

export interface PlatformOverviewVm {
  readonly system: SystemStatusVm;
  readonly stats: readonly StatCardVm[];
}

export interface ServiceVm {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly statusLabel: string;
  readonly tone: Tone;
  readonly latency: string;
  readonly uptime: string;
  readonly lastCheckLabel: string;
}

export interface WorkflowVm {
  readonly id: string;
  readonly name: string;
  readonly workflowRef: string;
  readonly statusLabel: string;
  readonly tone: Tone;
  readonly currentStage: string;
  readonly updatedLabel: string;
}

export interface ExecutionVm {
  readonly id: string;
  readonly title: string;
  readonly statusLabel: string;
  readonly tone: Tone;
  readonly mode: string;
  readonly updatedLabel: string;
}

export interface ValidationVm {
  readonly id: string;
  readonly subject: string;
  readonly statusLabel: string;
  readonly tone: Tone;
  readonly updatedLabel: string;
}

export interface DatasetVm {
  readonly id: string;
  readonly name: string;
  readonly statusLabel: string;
  readonly tone: Tone;
  readonly freshness: string;
  readonly updatedLabel: string;
}

export interface AgentVm {
  readonly id: string;
  readonly name: string;
  readonly authority: string;
  readonly statusLabel: string;
  readonly tone: Tone;
  readonly lastSeenLabel: string;
}

export interface AlertVm {
  readonly id: string;
  readonly title: string;
  readonly source: string;
  readonly severityLabel: string;
  readonly tone: Tone;
  readonly raisedLabel: string;
  readonly acknowledged: boolean;
}

export interface IncidentVm {
  readonly id: string;
  readonly title: string;
  readonly statusLabel: string;
  readonly severityLabel: string;
  readonly tone: Tone;
  readonly openedLabel: string;
}

export interface MetricVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly tone: Tone;
}

export interface AuditEventVm {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly target: string;
  readonly occurredLabel: string;
}
