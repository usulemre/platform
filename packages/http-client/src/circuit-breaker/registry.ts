/**
 * The registries. `CircuitPolicyRegistry` stores named circuit policies (seeded with the canonical
 * default). `CircuitRegistry` is the get-or-create store of live `CircuitBreaker` instances — one per
 * provider key — sharing an injected clock so the whole engine is deterministic. A registry-level
 * event listener is attached to every breaker (existing and future) for the Monitoring Module.
 */
import { CircuitBreaker } from './breaker';
import type { Clock } from '../client';
import type { CircuitEventListener } from './events';
import { DEFAULT_CIRCUIT_POLICY, type CircuitPolicy } from './policy';

export class CircuitPolicyRegistry {
  private readonly policies = new Map<string, CircuitPolicy>();
  private defaultName: string;

  constructor(policies: readonly CircuitPolicy[] = []) {
    this.policies.set(DEFAULT_CIRCUIT_POLICY.name, DEFAULT_CIRCUIT_POLICY);
    for (const policy of policies) this.policies.set(policy.name, policy);
    this.defaultName = DEFAULT_CIRCUIT_POLICY.name;
  }

  register(policy: CircuitPolicy, options: { readonly override?: boolean } = {}): this {
    if (this.policies.has(policy.name) && !options.override) {
      throw new Error(
        `Circuit policy "${policy.name}" is already registered; pass { override: true } to replace it.`,
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
  get(name: string): CircuitPolicy | undefined {
    return this.policies.get(name);
  }
  names(): readonly string[] {
    return [...this.policies.keys()];
  }
  setDefault(name: string): this {
    if (!this.policies.has(name)) throw new Error(`Unknown circuit policy "${name}".`);
    this.defaultName = name;
    return this;
  }
  resolve(policy?: string | CircuitPolicy): CircuitPolicy {
    if (policy === undefined) return this.policies.get(this.defaultName) ?? DEFAULT_CIRCUIT_POLICY;
    if (typeof policy === 'string') {
      const found = this.policies.get(policy);
      if (!found) throw new Error(`Unknown circuit policy "${policy}".`);
      return found;
    }
    return policy;
  }
}

export class CircuitRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();
  private readonly listeners: CircuitEventListener[] = [];

  constructor(private readonly deps: { readonly clock?: Clock } = {}) {}

  /** Get the breaker for `name`, creating it with `policy` on first use. */
  getOrCreate(name: string, policy: CircuitPolicy): CircuitBreaker {
    let breaker = this.breakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker(name, policy, { clock: this.deps.clock });
      for (const listener of this.listeners) breaker.on(listener);
      this.breakers.set(name, breaker);
    }
    return breaker;
  }

  has(name: string): boolean {
    return this.breakers.has(name);
  }
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }
  names(): readonly string[] {
    return [...this.breakers.keys()];
  }
  all(): readonly CircuitBreaker[] {
    return [...this.breakers.values()];
  }
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }
  clear(): void {
    this.breakers.clear();
  }
  get size(): number {
    return this.breakers.size;
  }

  /** Attach a listener to every breaker — existing and future. Returns an unsubscribe function. */
  onEvent(listener: CircuitEventListener): () => void {
    this.listeners.push(listener);
    const unsubscribers = this.all().map((breaker) => breaker.on(listener));
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }
}
