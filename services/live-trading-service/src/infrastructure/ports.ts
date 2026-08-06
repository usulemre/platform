/**
 * Infrastructure INTERFACES (ports) for the live-trading service. The application and
 * domain layers depend only on these abstractions; concrete adapters are injected at
 * composition time. NO implementation here: no storage, no cache, no database, no broker
 * SDK, no exchange SDK, no API keys, no HTTP/REST client, no WebSocket, no FIX, no order
 * execution, no PnL/exposure computation. Other subsystems (Execution Simulator, Risk
 * Engine, Portfolio Construction Engine, Signal Engine, Market Data Platform, Connector
 * Management, Configuration Foundation, Validation Foundation, Workflow Engine,
 * Authentication, Audit Center, Monitoring Module, Notification Center) are reached
 * through these abstractions by reference only.
 */
import type {
  Deployment,
  DeploymentFamily,
  TradingAccount,
  BrokerConnection,
} from '@platform/trading-sdk';

/* ----------------------------- read models ----------------------------- */

export interface DeploymentQueryPort {
  list(): Promise<readonly Deployment[]>;
  getById(id: string): Promise<Deployment | null>;
}

export interface FamilyQueryPort {
  list(): Promise<readonly DeploymentFamily[]>;
}

export interface AccountQueryPort {
  list(): Promise<readonly TradingAccount[]>;
}

export interface ConnectionQueryPort {
  list(): Promise<readonly BrokerConnection[]>;
}

/* --------------------------- integration ports -------------------------- */

/** Risk Engine — whether the deployment cleared pre-deployment risk approval. */
export interface RiskPort {
  isRiskApproved(deploymentId: string): Promise<boolean>;
}

/** Validation Foundation — whether the deployment cleared its validation gate. */
export interface ValidationPort {
  isValidated(deploymentId: string): Promise<boolean>;
}

/** Authentication / Governance — whether a valid, time-boxed live authorization token exists. */
export interface AuthorizationPort {
  isLiveAuthorized(deploymentId: string): Promise<boolean>;
}

/**
 * Broker Gateway — the abstraction boundary to the (external, future-infrastructure)
 * broker/exchange connectors. This service NEVER contacts a broker or exchange, NEVER
 * holds a credential, and NEVER speaks REST/WebSocket/FIX; it only routes governed
 * deployment/runtime intents through this port. Concrete connectors live behind Connector
 * Management in infrastructure.
 */
export interface BrokerGatewayPort {
  deploy(deploymentId: string): Promise<void>;
  pause(deploymentId: string): Promise<void>;
  resume(deploymentId: string): Promise<void>;
  stop(deploymentId: string): Promise<void>;
  restart(deploymentId: string): Promise<void>;
  rollback(deploymentId: string): Promise<void>;
  emergencyStop(deploymentId: string): Promise<void>;
  /** The kill switch — always honoured; forces the deployment to halt. */
  engageKillSwitch(deploymentId: string): Promise<void>;
}

/* --------------------------- foundation ports --------------------------- */

/** Workflow Engine — schedule deployment/risk-approval/deployment-approval workflows. */
export interface WorkflowPort {
  scheduleDeployment(deploymentId: string): Promise<void>;
  scheduleRiskApproval(deploymentId: string): Promise<void>;
  scheduleDeploymentApproval(deploymentId: string): Promise<void>;
}

export interface TradingEvent {
  readonly id: string;
  readonly deploymentId: string;
  readonly type:
    | 'DEPLOYMENT_REQUESTED'
    | 'RISK_APPROVAL_REQUESTED'
    | 'DEPLOYMENT_APPROVAL_REQUESTED'
    | 'RUNTIME_PAUSED'
    | 'RUNTIME_RESUMED'
    | 'RUNTIME_STOPPED'
    | 'RUNTIME_RESTARTED'
    | 'ROLLBACK_REQUESTED'
    | 'EMERGENCY_STOP'
    | 'KILL_SWITCH_ENGAGED';
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: TradingEvent): Promise<void>;
}

/** Audit Center — append a tamper-evident audit entry (append only; store is elsewhere). */
export interface AuditPort {
  record(entry: {
    readonly deploymentId: string;
    readonly actor: string;
    readonly action: string;
    readonly at: string;
  }): Promise<void>;
}

/** Notification Center — notify a role/channel (delivery is elsewhere). */
export interface NotificationPort {
  notify(message: {
    readonly deploymentId: string;
    readonly channel: string;
    readonly summary: string;
  }): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
