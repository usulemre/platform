/**
 * `AuthenticationMetrics` — deterministic, in-memory counters for authentication activity: requests
 * authenticated, payloads signed, validations run and failed, and credential rotations, broken down by
 * scheme. Snapshots are plain, immutable data for the Monitoring Module. Never contains secrets.
 */
export interface AuthenticationMetricsSnapshot {
  readonly authenticated: number;
  readonly signed: number;
  readonly validated: number;
  readonly validationFailures: number;
  readonly rotations: number;
  readonly byScheme: readonly { readonly scheme: string; readonly count: number }[];
}

export class AuthenticationMetrics {
  private authenticated = 0;
  private signed = 0;
  private validated = 0;
  private validationFailures = 0;
  private rotations = 0;
  private readonly schemeCounts = new Map<string, number>();

  onAuthenticated(scheme: string): void {
    this.authenticated += 1;
    this.schemeCounts.set(scheme, (this.schemeCounts.get(scheme) ?? 0) + 1);
  }
  onSigned(): void {
    this.signed += 1;
  }
  onValidated(ok: boolean): void {
    this.validated += 1;
    if (!ok) this.validationFailures += 1;
  }
  onRotated(count = 1): void {
    this.rotations += count;
  }

  snapshot(): AuthenticationMetricsSnapshot {
    return {
      authenticated: this.authenticated,
      signed: this.signed,
      validated: this.validated,
      validationFailures: this.validationFailures,
      rotations: this.rotations,
      byScheme: [...this.schemeCounts.entries()]
        .map(([scheme, count]) => ({ scheme, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  reset(): void {
    this.authenticated = 0;
    this.signed = 0;
    this.validated = 0;
    this.validationFailures = 0;
    this.rotations = 0;
    this.schemeCounts.clear();
  }
}
