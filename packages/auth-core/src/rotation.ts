/**
 * `CredentialRotator` — decides when a credential is due for rotation and applies the swap in the
 * `CredentialManager`, returning a record of the previous and current credentials so callers can honor
 * a grace window. Deterministic: "due" is evaluated against an injected `now` and the policy's
 * `rotateBeforeExpiryMs`. It does not fetch new material — the caller supplies the replacement (which
 * itself comes from the secret abstraction).
 */
import type { Credential } from './credential';
import type { CredentialManager } from './credential-manager';

export interface RotationPolicy {
  /** Rotate once the credential is within this many ms of expiry. */
  readonly rotateBeforeExpiryMs: number;
}

export interface RotationRecord {
  readonly id: string;
  readonly previous: Credential;
  readonly current: Credential;
  readonly rotatedAt: number;
}

export class CredentialRotator {
  constructor(
    private readonly credentials: CredentialManager,
    private readonly policy: RotationPolicy = { rotateBeforeExpiryMs: 0 },
  ) {}

  /** Whether a credential should be rotated now (expiring within the policy window). */
  dueForRotation(credential: Credential, now: number): boolean {
    return credential.timeToExpiry(now) <= this.policy.rotateBeforeExpiryMs;
  }

  /** Replace a credential with `next`, returning the rotation record. */
  rotate(id: string, next: Credential, now: number): RotationRecord {
    const previous = this.credentials.require(id);
    this.credentials.register(next, { override: true });
    return { id, previous, current: next, rotatedAt: now };
  }

  /**
   * Rotate every due credential, sourcing replacements from `provide`. A credential is skipped when
   * `provide` returns `undefined`. Returns the records of the rotations performed.
   */
  rotateDue(
    now: number,
    provide: (credential: Credential) => Credential | undefined,
  ): readonly RotationRecord[] {
    const records: RotationRecord[] = [];
    for (const id of this.credentials.ids()) {
      const credential = this.credentials.require(id);
      if (!this.dueForRotation(credential, now)) continue;
      const next = provide(credential);
      if (next) records.push(this.rotate(id, next, now));
    }
    return records;
  }
}
