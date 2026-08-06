import { Badge } from '@platform/ui';
import { InfoCard, KeyValueList, StatusBadge } from './connector-atoms';
import type {
  CapabilityVm,
  ConfigurationVm,
  CredentialVm,
  DiagnosticVm,
  HealthVm,
  MetadataRowVm,
  MetricsVm,
  ValidationVm,
} from '../domain/view-model';

/** Connector configuration (non-secret parameters via Configuration Foundation). */
export function ConnectorConfiguration({ configuration }: { configuration: ConfigurationVm }) {
  return (
    <InfoCard title="Configuration">
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={configuration.environment.label}
            tone={configuration.environment.tone}
          />
          <span className="font-mono text-xs text-muted-foreground">{configuration.configRef}</span>
          {configuration.updatedLabel ? (
            <span className="text-xs text-muted-foreground">
              · Updated {configuration.updatedLabel}
            </span>
          ) : null}
        </div>
        {configuration.fields.length === 0 ? (
          <p className="text-muted-foreground">No configuration parameters.</p>
        ) : (
          <ul className="space-y-1">
            {configuration.fields.map((field) => (
              <li key={field.key} className="flex items-center justify-between gap-4 border-b py-1">
                <span className="text-muted-foreground">
                  {field.label}
                  {field.secret ? (
                    <Badge variant="outline" className="ml-2">
                      secret
                    </Badge>
                  ) : null}
                </span>
                <span className="truncate font-mono text-xs">{field.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </InfoCard>
  );
}

/**
 * Connector credentials — PLACEHOLDER. Presence/status by brokered reference
 * ONLY. No secret is ever fetched, shown, entered, or stored here (SEC-3).
 */
export function ConnectorCredentials({ credentials }: { credentials: readonly CredentialVm[] }) {
  return (
    <InfoCard title="Credentials">
      <p className="mb-2 text-xs text-muted-foreground">
        Placeholder — credential material is managed by the secrets broker and referenced here by
        pointer only. No secret values are handled by this console.
      </p>
      {credentials.length === 0 ? (
        <p className="text-sm text-muted-foreground">No credentials configured.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {credentials.map((credential) => (
            <li
              key={credential.kind}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span>
                {credential.kind}
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {credential.secretRef}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge label={credential.status.label} tone={credential.status.tone} />
                {credential.rotatedLabel ? (
                  <span className="text-xs text-muted-foreground">
                    Rotated {credential.rotatedLabel}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Connector capabilities (declared operations + support level). */
export function ConnectorCapabilities({ capabilities }: { capabilities: readonly CapabilityVm[] }) {
  return (
    <InfoCard title="Capabilities">
      {capabilities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No capabilities declared.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {capabilities.map((capability) => (
            <li
              key={capability.key}
              className="flex items-start justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-medium">{capability.label}</span>
                {capability.note ? (
                  <span className="ml-1 text-xs text-muted-foreground">— {capability.note}</span>
                ) : null}
              </span>
              <StatusBadge label={capability.support.label} tone={capability.support.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Connector health panel. */
export function ConnectorHealth({ health }: { health: HealthVm }) {
  return (
    <InfoCard title="Health">
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <StatusBadge label={health.status.label} tone={health.status.tone} />
          <span className="text-xs text-muted-foreground">Checked {health.lastCheckedLabel}</span>
        </p>
        <p className="text-muted-foreground">{health.message}</p>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <span>
            Latency: <span className="font-medium text-foreground">{health.latency}</span>
          </span>
          <span>
            Uptime: <span className="font-medium text-foreground">{health.uptime}</span>
          </span>
        </div>
      </div>
    </InfoCard>
  );
}

/** Connector metrics (pre-supplied operational values; nothing computed). */
export function ConnectorMetrics({ metrics }: { metrics: MetricsVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Requests to date', value: metrics.requestsToDate },
    { label: 'Error rate', value: metrics.errorRate },
    { label: 'Avg latency', value: metrics.avgLatency },
    { label: 'Rate limit', value: metrics.rateLimit },
    { label: 'Last request', value: metrics.lastRequestLabel ?? '—' },
  ];
  return (
    <InfoCard title="Metrics">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Connector diagnostics (operational checks). */
export function ConnectorDiagnostics({ diagnostics }: { diagnostics: readonly DiagnosticVm[] }) {
  return (
    <InfoCard title="Diagnostics">
      {diagnostics.length === 0 ? (
        <p className="text-sm text-muted-foreground">No diagnostics available.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {diagnostics.map((diagnostic) => (
            <li key={diagnostic.check} className="flex items-start gap-2 border-b py-1">
              <StatusBadge label={diagnostic.status.label} tone={diagnostic.status.tone} />
              <span>
                <span className="font-medium">{diagnostic.check}</span>{' '}
                <span className="text-muted-foreground">— {diagnostic.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Connector configuration validation summary (Validation Foundation). */
export function ConnectorValidation({ validation }: { validation: ValidationVm }) {
  return (
    <InfoCard title="Validation">
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <StatusBadge label={validation.label} tone={validation.tone} />
          <span className="text-xs text-muted-foreground">
            {validation.checkedLabel ? `Checked ${validation.checkedLabel}` : 'Not checked'} ·{' '}
            {validation.issueCount} issue{validation.issueCount === 1 ? '' : 's'}
          </span>
        </p>
        {validation.issueCount > 0 ? (
          <ul className="space-y-1">
            {validation.issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="flex items-start gap-2">
                <StatusBadge label={issue.severity} tone={issue.tone} />
                <span>
                  <span className="font-mono text-xs text-muted-foreground">{issue.code}</span>{' '}
                  {issue.message}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No issues reported.</p>
        )}
      </div>
    </InfoCard>
  );
}

/**
 * Connector logs — PLACEHOLDER. Log content is owned by the Monitoring /
 * Observability tier; this console links out rather than storing or streaming
 * logs.
 */
export function ConnectorLogs() {
  return (
    <InfoCard title="Logs">
      <p className="text-sm text-muted-foreground">
        Placeholder — connector logs are surfaced through the Monitoring module and the
        observability run-ledger. This console does not store, stream, or expose raw log data.
      </p>
    </InfoCard>
  );
}
