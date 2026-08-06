'use client';

import {
  AlertTriangle,
  Boxes,
  Bot,
  Database,
  FlaskConical,
  PlayCircle,
  Server,
  Workflow,
} from 'lucide-react';
import {
  useAgents,
  useAlerts,
  useDatasets,
  useExecutions,
  useIncidents,
  useServices,
  useValidations,
  useWorkflows,
} from '../hooks/use-monitoring';
import { MonitorListPanel, type PanelItem } from './monitoring-atoms';

/** Service health monitor (Service Status). Links to the full searchable list. */
export function ServiceHealth() {
  const query = useServices({});
  const items: PanelItem[] = (query.data ?? []).map((service) => ({
    id: service.id,
    primary: service.name,
    secondary: `${service.category} · ${service.latency} · uptime ${service.uptime}`,
    badge: { label: service.statusLabel, tone: service.tone },
  }));
  return (
    <MonitorListPanel
      title="Service health"
      icon={Server}
      query={query}
      items={items}
      emptyLabel="No services reporting."
      href="/services"
    />
  );
}

/** Agent status monitor (Agent Registry — advisory agents). */
export function AgentMonitoring() {
  const query = useAgents();
  const items: PanelItem[] = (query.data ?? []).map((agent) => ({
    id: agent.id,
    primary: agent.name,
    secondary: `${agent.id} · ${agent.authority} · seen ${agent.lastSeenLabel}`,
    badge: { label: agent.statusLabel, tone: agent.tone },
  }));
  return (
    <MonitorListPanel
      title="Agents"
      icon={Bot}
      query={query}
      items={items}
      emptyLabel="No agents registered."
    />
  );
}

/** Workflow state monitor (Workflow Engine). */
export function WorkflowMonitoring() {
  const query = useWorkflows();
  const items: PanelItem[] = (query.data ?? []).map((workflow) => ({
    id: workflow.id,
    primary: `${workflow.workflowRef} · ${workflow.name}`,
    secondary: workflow.currentStage,
    badge: { label: workflow.statusLabel, tone: workflow.tone },
  }));
  return (
    <MonitorListPanel
      title="Workflows"
      icon={Workflow}
      query={query}
      items={items}
      emptyLabel="No active workflows."
    />
  );
}

/** Execution queue monitor (Execution Module). */
export function ExecutionMonitoring() {
  const query = useExecutions();
  const items: PanelItem[] = (query.data ?? []).map((execution) => ({
    id: execution.id,
    primary: execution.title,
    secondary: `${execution.mode} · updated ${execution.updatedLabel}`,
    badge: { label: execution.statusLabel, tone: execution.tone },
  }));
  return (
    <MonitorListPanel
      title="Execution queue"
      icon={PlayCircle}
      query={query}
      items={items}
      emptyLabel="No execution requests."
    />
  );
}

/** Validation status monitor (Validation Foundation). */
export function ValidationMonitoring() {
  const query = useValidations();
  const items: PanelItem[] = (query.data ?? []).map((validation) => ({
    id: validation.id,
    primary: validation.subject,
    secondary: `Updated ${validation.updatedLabel}`,
    badge: { label: validation.statusLabel, tone: validation.tone },
  }));
  return (
    <MonitorListPanel
      title="Validation"
      icon={FlaskConical}
      query={query}
      items={items}
      emptyLabel="No validation activity."
    />
  );
}

/** Dataset monitor (Dataset Module — freshness / quarantine). */
export function DatasetMonitoring() {
  const query = useDatasets();
  const items: PanelItem[] = (query.data ?? []).map((dataset) => ({
    id: dataset.id,
    primary: dataset.name,
    secondary: dataset.freshness,
    badge: { label: dataset.statusLabel, tone: dataset.tone },
  }));
  return (
    <MonitorListPanel
      title="Datasets"
      icon={Database}
      query={query}
      items={items}
      emptyLabel="No datasets reporting."
    />
  );
}

/** Alerts panel. */
export function Alerts() {
  const query = useAlerts();
  const items: PanelItem[] = (query.data ?? []).map((alert) => ({
    id: alert.id,
    primary: alert.title,
    secondary: `${alert.source} · ${alert.acknowledged ? 'acknowledged' : 'unacknowledged'} · ${alert.raisedLabel}`,
    badge: { label: alert.severityLabel, tone: alert.tone },
  }));
  return (
    <MonitorListPanel
      title="Alerts"
      icon={AlertTriangle}
      query={query}
      items={items}
      emptyLabel="No active alerts."
    />
  );
}

/** Incident summary panel (Incident Response Governance). */
export function IncidentSummary() {
  const query = useIncidents();
  const items: PanelItem[] = (query.data ?? []).map((incident) => ({
    id: incident.id,
    primary: incident.title,
    secondary: `${incident.severityLabel} · opened ${incident.openedLabel}`,
    badge: { label: incident.statusLabel, tone: incident.tone },
  }));
  return (
    <MonitorListPanel
      title="Incidents"
      icon={Boxes}
      query={query}
      items={items}
      emptyLabel="No open incidents."
    />
  );
}
