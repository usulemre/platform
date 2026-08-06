/**
 * The registries. `RateLimitPolicyRegistry` stores named policies (seeded with the canonical default).
 * `RateLimiterRegistry` is the get-or-create store of live `RateLimiter` instances — one per scope key
 * — sharing an injected `Scheduler` so the whole engine is deterministic.
 */
import type { Scheduler } from '@platform/http-client';
import { RateLimiter } from './limiter';
import { DEFAULT_RATE_LIMIT_POLICY, type RateLimitPolicy } from './policy';

export class RateLimitPolicyRegistry {
  private readonly policies = new Map<string, RateLimitPolicy>();
  private defaultName: string;

  constructor(policies: readonly RateLimitPolicy[] = []) {
    this.policies.set(DEFAULT_RATE_LIMIT_POLICY.name, DEFAULT_RATE_LIMIT_POLICY);
    for (const policy of policies) this.policies.set(policy.name, policy);
    this.defaultName = DEFAULT_RATE_LIMIT_POLICY.name;
  }

  register(policy: RateLimitPolicy, options: { readonly override?: boolean } = {}): this {
    if (this.policies.has(policy.name) && !options.override) {
      throw new Error(
        `Rate-limit policy "${policy.name}" is already registered; pass { override: true } to replace it.`,
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
  get(name: string): RateLimitPolicy | undefined {
    return this.policies.get(name);
  }
  names(): readonly string[] {
    return [...this.policies.keys()];
  }
  setDefault(name: string): this {
    if (!this.policies.has(name)) throw new Error(`Unknown rate-limit policy "${name}".`);
    this.defaultName = name;
    return this;
  }
  resolve(policy?: string | RateLimitPolicy): RateLimitPolicy {
    if (policy === undefined)
      return this.policies.get(this.defaultName) ?? DEFAULT_RATE_LIMIT_POLICY;
    if (typeof policy === 'string') {
      const found = this.policies.get(policy);
      if (!found) throw new Error(`Unknown rate-limit policy "${policy}".`);
      return found;
    }
    return policy;
  }
}

export class RateLimiterRegistry {
  private readonly limiters = new Map<string, RateLimiter>();

  constructor(private readonly deps: { readonly scheduler: Scheduler }) {}

  /** Get the limiter for `key`, creating it with `policy` on first use. */
  getOrCreate(key: string, policy: RateLimitPolicy): RateLimiter {
    let limiter = this.limiters.get(key);
    if (!limiter) {
      limiter = new RateLimiter(key, policy, { scheduler: this.deps.scheduler });
      this.limiters.set(key, limiter);
    }
    return limiter;
  }

  has(key: string): boolean {
    return this.limiters.has(key);
  }
  get(key: string): RateLimiter | undefined {
    return this.limiters.get(key);
  }
  keys(): readonly string[] {
    return [...this.limiters.keys()];
  }
  all(): readonly RateLimiter[] {
    return [...this.limiters.values()];
  }
  remove(key: string): boolean {
    return this.limiters.delete(key);
  }
  get size(): number {
    return this.limiters.size;
  }
}
