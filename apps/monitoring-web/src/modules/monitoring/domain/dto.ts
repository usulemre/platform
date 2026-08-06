/**
 * Canonical Monitoring DTOs — the transport contract for operational data the
 * platform services expose. Inert data shapes only. Statuses/levels are
 * PRE-CLASSIFIED upstream (Monitoring Service, Production Monitoring Governance);
 * this module only presents them. No metrics collection, no alert delivery, no
 * monitoring infrastructure, no business logic.
 */

/** Unified severity/health level across all monitored domains. */
export type MonitorLevel = 'OK' | 'INFO' | 'WARN' | 'ERROR' | 'NEUTRAL';

export interface SystemStatusDto {
  readonly statusLabel: string;
  readonly level: MonitorLevel;
  readonly message: string;
  readonly updatedAt: string;
}

export interface PlatformOverviewDto {
  readonly services: number;
  readonly servicesHealthy: number;
  readonly workflowsRunning: number;
  readonly executionsQueued: number;
  readonly agentsActive: number;
  readonly openAlerts: number;
  readonly openIncidents: number;
  readonly system: SystemStatusDto;
}

export interface ServiceDto {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly statusLabel: string;
  readonly level: MonitorLevel;
  readonly latency: string;
  readonly uptime: string;
  readonly lastCheck: string;
}

export interface WorkflowMonitorDto {
  readonly id: string;
  readonly name: string;
  readonly workflowRef: string;
  readonly statusLabel: string;
  readonly level: MonitorLevel;
  readonly currentStage: string;
  readonly updatedAt: string;
}

export interface ExecutionMonitorDto {
  readonly id: string;
  readonly title: string;
  readonly statusLabel: string;
  readonly level: MonitorLevel;
  readonly mode: string;
  readonly updatedAt: string;
}

export interface ValidationMonitorDto {
  readonly id: string;
  readonly subject: string;
  readonly statusLabel: string;
  readonly level: MonitorLevel;
  readonly updatedAt: string;
}

export interface DatasetMonitorDto {
  readonly id: string;
  readonly name: string;
  readonly statusLabel: string;
  readonly level: MonitorLevel;
  readonly freshness: string;
  readonly updatedAt: string;
}

export interface AgentDto {
  readonly id: string;
  readonly name: string;
  readonly authority: string;
  readonly statusLabel: string;
  readonly level: MonitorLevel;
  readonly lastSeen: string;
}

export interface AlertDto {
  readonly id: string;
  readonly title: string;
  readonly source: string;
  readonly severityLabel: string;
  readonly level: MonitorLevel;
  readonly raisedAt: string;
  readonly acknowledged: boolean;
}

export interface IncidentDto {
  readonly id: string;
  readonly title: string;
  readonly statusLabel: string;
  readonly severityLabel: string;
  readonly level: MonitorLevel;
  readonly openedAt: string;
}

export interface MetricDto {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly level: MonitorLevel;
}

export interface AuditEventDto {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly target: string;
  readonly occurredAt: string;
}
