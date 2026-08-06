/**
 * Canonical Connector DTOs — the transport contract for the Connector Management
 * Platform. Inert data shapes only. These describe connector ABSTRACTIONS and
 * their governed metadata; they perform no external communication. Actual
 * provider implementations belong to future infrastructure packages.
 *
 * No secrets, no credentials, no HTTP clients, no SDKs: credential material is
 * referenced by a brokered reference ONLY (CLAUDE.md SEC-3), never carried here.
 */

/** Extensible connector taxonomy — every external integration class the platform
 *  supports. The core never branches on a specific provider (CP-8). */
export type ConnectorTypeDto =
  | 'MARKET_DATA'
  | 'EXCHANGE'
  | 'BROKER'
  | 'OPTIONS'
  | 'BLOCKCHAIN'
  | 'NEWS'
  | 'MACRO_DATA'
  | 'ALT_DATA'
  | 'AI_PROVIDER'
  | 'STORAGE'
  | 'NOTIFICATION';

/** Administrative lifecycle/enablement status. Distinct from health. */
export type ConnectorStatusDto =
  | 'REGISTERED'
  | 'ENABLED'
  | 'DISABLED'
  | 'MAINTENANCE'
  | 'DEPRECATED'
  | 'RETIRED';

export type HealthStatusDto = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export type EnvironmentDto = 'SANDBOX' | 'PRODUCTION';

export type CapabilitySupportDto = 'SUPPORTED' | 'PARTIAL' | 'UNSUPPORTED' | 'PLANNED';

/** Credential presence only — never the secret. `secretRef` is a brokered
 *  reference resolved by the secrets broker at the infrastructure tier. */
export type CredentialStatusDto = 'CONFIGURED' | 'MISSING' | 'EXPIRED' | 'NOT_REQUIRED';

export type DiagnosticStatusDto = 'PASS' | 'WARN' | 'FAIL' | 'SKIPPED';

export type ValidationStatusDto = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
export type ValidationSeverityDto = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssueDto {
  readonly code: string;
  readonly severity: ValidationSeverityDto;
  readonly message: string;
}

export interface ValidationReportDto {
  readonly status: ValidationStatusDto;
  readonly issues: readonly ValidationIssueDto[];
  readonly checkedAt?: string;
}

/** A declared connector capability (an operation the abstraction can expose). */
export interface ConnectorCapabilityDto {
  readonly key: string;
  readonly label: string;
  readonly support: CapabilitySupportDto;
  readonly note?: string;
}

/** A single non-secret configuration parameter. Secret-bearing fields carry
 *  `secret: true` and a reference in `value` — never the secret value itself. */
export interface ConnectorConfigFieldDto {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly secret: boolean;
}

export interface ConnectorConfigurationDto {
  readonly environment: EnvironmentDto;
  readonly configRef: string;
  readonly fields: readonly ConnectorConfigFieldDto[];
  readonly updatedAt?: string;
}

export interface ConnectorCredentialDto {
  readonly kind: string;
  readonly status: CredentialStatusDto;
  /** Brokered reference (e.g. `vault://…`) — NOT a secret (SEC-3). */
  readonly secretRef: string;
  readonly rotatedAt?: string;
}

export interface ConnectorHealthDto {
  readonly status: HealthStatusDto;
  readonly message: string;
  readonly latency: string;
  readonly uptime: string;
  readonly lastCheckedAt: string;
}

/** Pre-supplied operational metrics (display values only — nothing is computed
 *  here; the platform never calls the provider). */
export interface ConnectorMetricsDto {
  readonly requestsToDate: string;
  readonly errorRate: string;
  readonly avgLatency: string;
  readonly rateLimit: string;
  readonly lastRequestAt?: string;
}

export interface ConnectorDiagnosticDto {
  readonly check: string;
  readonly status: DiagnosticStatusDto;
  readonly detail: string;
}

export interface LifecycleEventDto {
  readonly stage: string;
  readonly label: string;
  readonly occurredAt?: string;
}

export interface ActivityEventDto {
  readonly id: string;
  readonly label: string;
  readonly actor?: string;
  readonly occurredAt: string;
}

export interface ConnectorVersionDto {
  readonly version: string;
  readonly releasedAt: string;
  readonly note: string;
  readonly apiVersion?: string;
}

export interface ConnectorDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly provider: string;
  readonly description: string;
  readonly type: ConnectorTypeDto;
  readonly status: ConnectorStatusDto;
  readonly environment: EnvironmentDto;
  readonly owner: string;
  readonly team: string;
  readonly version: string;
  readonly registryId?: string;
  readonly health: ConnectorHealthDto;
  readonly configuration: ConnectorConfigurationDto;
  readonly credentials: readonly ConnectorCredentialDto[];
  readonly capabilities: readonly ConnectorCapabilityDto[];
  readonly metrics: ConnectorMetricsDto;
  readonly diagnostics: readonly ConnectorDiagnosticDto[];
  readonly validation: ValidationReportDto;
  readonly lifecycle: readonly LifecycleEventDto[];
  readonly activity: readonly ActivityEventDto[];
  readonly versions: readonly ConnectorVersionDto[];
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly registeredAt?: string;
  readonly retiredAt?: string;
}
