/**
 * `RetryPolicyRegistry` — a mutable, name-keyed registry of retry policies. Providers register their
 * named policies here and resolve one by name (or fall back to the default). Provider-independent: the
 * registry stores policy *data*, not provider logic. Pre-seeded with the canonical `default` and
 * `no-retry` policies.
 */
import { DEFAULT_RETRY_POLICY, NO_RETRY_POLICY, type RetryPolicy } from './policy';

export class RetryPolicyRegistry {
  private readonly policies = new Map<string, RetryPolicy>();
  private defaultName: string;

  constructor(policies: readonly RetryPolicy[] = []) {
    this.policies.set(DEFAULT_RETRY_POLICY.name, DEFAULT_RETRY_POLICY);
    this.policies.set(NO_RETRY_POLICY.name, NO_RETRY_POLICY);
    for (const policy of policies) this.policies.set(policy.name, policy);
    this.defaultName = DEFAULT_RETRY_POLICY.name;
  }

  register(policy: RetryPolicy, options: { readonly override?: boolean } = {}): this {
    if (this.policies.has(policy.name) && !options.override) {
      throw new Error(
        `Retry policy "${policy.name}" is already registered; pass { override: true } to replace it.`,
      );
    }
    this.policies.set(policy.name, policy);
    return this;
  }

  unregister(name: string): boolean {
    return this.policies.delete(name);
  }

  has(name: string): boolean {
    return this.policies.has(name);
  }
  get(name: string): RetryPolicy | undefined {
    return this.policies.get(name);
  }
  names(): readonly string[] {
    return [...this.policies.keys()];
  }

  /** Choose which policy is returned when none is specified. */
  setDefault(name: string): this {
    if (!this.policies.has(name)) throw new Error(`Unknown retry policy "${name}".`);
    this.defaultName = name;
    return this;
  }

  /** Resolve a policy from a name, an inline policy, or the default when omitted. */
  resolve(policy?: string | RetryPolicy): RetryPolicy {
    if (policy === undefined) return this.policies.get(this.defaultName) ?? DEFAULT_RETRY_POLICY;
    if (typeof policy === 'string') {
      const found = this.policies.get(policy);
      if (!found) throw new Error(`Unknown retry policy "${policy}".`);
      return found;
    }
    return policy;
  }
}
