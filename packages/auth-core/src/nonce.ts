/**
 * Nonce generation. A nonce is a value used at most once to prevent replay. Every generator draws from
 * an INJECTED source (a counter, a clock, or a `random` function), never from ambient randomness, so
 * behavior is deterministic and reproducible in tests. Providers choose the format they need.
 */
import { toHex } from './crypto';

export interface NonceGenerator {
  next(): string;
}

/** A strictly increasing counter nonce (fully deterministic). */
export class CounterNonceGenerator implements NonceGenerator {
  constructor(private value = 0) {}
  next(): string {
    this.value += 1;
    return this.value.toString();
  }
}

/** A clock + counter nonce (`<ms>-<n>`) — unique and monotonic given a monotonic clock. */
export class TimestampNonceGenerator implements NonceGenerator {
  private counter = 0;
  constructor(private readonly clock: () => number) {}
  next(): string {
    this.counter += 1;
    return `${this.clock()}-${this.counter}`;
  }
}

/** A random hex nonce drawn from an injected `random` source (0 ≤ r < 1). */
export class RandomNonceGenerator implements NonceGenerator {
  constructor(
    private readonly random: () => number,
    private readonly bytes = 16,
  ) {}
  next(): string {
    const out = new Uint8Array(this.bytes);
    for (let i = 0; i < this.bytes; i += 1) out[i] = Math.floor(this.random() * 256) & 0xff;
    return toHex(out);
  }
}
