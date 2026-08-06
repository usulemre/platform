/**
 * In-memory read-model adapters. Development/test only — no persistence, no
 * cache, no database. They implement the query ports over the synthetic seed.
 */
import type { RegisteredSignal, SignalFamily } from '@platform/signal-sdk';
import type { FamilyQueryPort, SignalQueryPort } from '../ports';
import { FAMILIES, SIGNALS } from './seed';

export class InMemorySignalQuery implements SignalQueryPort {
  constructor(private readonly data: readonly RegisteredSignal[] = SIGNALS) {}
  async list(): Promise<readonly RegisteredSignal[]> {
    return this.data;
  }
  async getById(id: string): Promise<RegisteredSignal | null> {
    return this.data.find((signal) => signal.id === id) ?? null;
  }
}

export class InMemoryFamilyQuery implements FamilyQueryPort {
  constructor(private readonly data: readonly SignalFamily[] = FAMILIES) {}
  async list(): Promise<readonly SignalFamily[]> {
    return this.data;
  }
}
