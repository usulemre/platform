'use client';

import { MetricsOverview, PlatformOverview, SystemStatus } from './overview';
import {
  AgentMonitoring,
  Alerts,
  DatasetMonitoring,
  ExecutionMonitoring,
  IncidentSummary,
  ServiceHealth,
  ValidationMonitoring,
  WorkflowMonitoring,
} from './monitors';
import { AuditTimeline } from './audit-timeline';

/**
 * Monitoring dashboard — composes the platform overview, metrics, per-domain
 * monitor panels and the audit timeline. Each section fetches its own operational
 * slice via the application service; this component only lays them out.
 */
export function MonitoringDashboard() {
  return (
    <div className="space-y-6">
      <SystemStatus />
      <PlatformOverview />
      <MetricsOverview />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ServiceHealth />
        <AgentMonitoring />
        <WorkflowMonitoring />
        <ExecutionMonitoring />
        <ValidationMonitoring />
        <DatasetMonitoring />
        <Alerts />
        <IncidentSummary />
      </div>

      <AuditTimeline />
    </div>
  );
}
