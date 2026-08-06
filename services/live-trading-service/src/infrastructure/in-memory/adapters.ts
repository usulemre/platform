/**
 * In-memory / stub adapters for the live-trading service integration and foundation
 * ports. Development/test only — NO storage, NO cache, NO database, NO broker SDK, NO
 * exchange SDK, NO API keys, NO HTTP/REST client, NO WebSocket, NO FIX, NO order
 * execution, NO external calls. They satisfy the port contracts so the application layer
 * can run against synthetic data; swapping in real adapters (Risk Engine, Validation
 * Foundation, Authentication, Connector Management / broker gateway, Workflow Engine,
 * Event & Messaging Foundation, Audit Center, Notification Center, Configuration
 * Foundation) requires no application/domain change.
 */
import type {
  AuditPort,
  AuthorizationPort,
  BrokerGatewayPort,
  ConfigurationPort,
  EventBusPort,
  NotificationPort,
  RiskPort,
  TradingEvent,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { DEPLOYMENTS } from './seed';

/** Risk Engine — a deployment is risk-approved when it recorded an approved RISK approval. */
export class StubRisk implements RiskPort {
  async isRiskApproved(deploymentId: string): Promise<boolean> {
    const deployment = DEPLOYMENTS.find((candidate) => candidate.id === deploymentId);
    return (
      !!deployment && deployment.approvals.some((a) => a.kind === 'RISK' && a.status === 'APPROVED')
    );
  }
}

/** Validation Foundation — a deployment is validated when it recorded PASSED. */
export class StubValidation implements ValidationPort {
  async isValidated(deploymentId: string): Promise<boolean> {
    return (
      DEPLOYMENTS.find((deployment) => deployment.id === deploymentId)?.validation.status ===
      'PASSED'
    );
  }
}

/** Authentication / governance — live-authorized when mode is LIVE and the token is valid. */
export class StubAuthorization implements AuthorizationPort {
  async isLiveAuthorized(deploymentId: string): Promise<boolean> {
    const deployment = DEPLOYMENTS.find((candidate) => candidate.id === deploymentId);
    return !!deployment && deployment.mode === 'LIVE' && !!deployment.authorization?.valid;
  }
}

/**
 * Broker Gateway — records intent only; NEVER contacts a broker or exchange, NEVER holds a
 * credential, NEVER speaks REST/WebSocket/FIX. The kill switch is always honoured here as
 * a no-op record (the real forced-halt happens in infrastructure behind Connector
 * Management).
 */
export class StubBrokerGateway implements BrokerGatewayPort {
  async deploy(): Promise<void> {
    /* no-op */
  }
  async pause(): Promise<void> {
    /* no-op */
  }
  async resume(): Promise<void> {
    /* no-op */
  }
  async stop(): Promise<void> {
    /* no-op */
  }
  async restart(): Promise<void> {
    /* no-op */
  }
  async rollback(): Promise<void> {
    /* no-op */
  }
  async emergencyStop(): Promise<void> {
    /* no-op */
  }
  async engageKillSwitch(): Promise<void> {
    /* no-op: always honoured; real forced-halt is in infrastructure. */
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleDeployment(): Promise<void> {
    /* no-op */
  }
  async scheduleRiskApproval(): Promise<void> {
    /* no-op */
  }
  async scheduleDeploymentApproval(): Promise<void> {
    /* no-op */
  }
}

/** Event & Messaging Foundation — collects published events in memory. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: TradingEvent[] = [];
  async publish(event: TradingEvent): Promise<void> {
    this.published.push(event);
  }
}

/** Audit Center — collects appended audit entries in memory. */
export class InMemoryAudit implements AuditPort {
  readonly entries: { deploymentId: string; actor: string; action: string; at: string }[] = [];
  async record(entry: {
    deploymentId: string;
    actor: string;
    action: string;
    at: string;
  }): Promise<void> {
    this.entries.push(entry);
  }
}

/** Notification Center — collects notifications in memory. */
export class InMemoryNotifications implements NotificationPort {
  readonly sent: { deploymentId: string; channel: string; summary: string }[] = [];
  async notify(message: { deploymentId: string; channel: string; summary: string }): Promise<void> {
    this.sent.push(message);
  }
}

/** Configuration Foundation — static, non-secret configuration by key. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
