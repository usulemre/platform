/**
 * In-memory read-model adapters. Development/test only — no persistence, no
 * cache, no database. They implement the query ports over the synthetic seed.
 */
import type { FeatureFamily, RegisteredFeature } from '@platform/feature-store-sdk';
import type { FamilyQueryPort, FeatureQueryPort } from '../ports';
import { FAMILIES, FEATURES } from './seed';

export class InMemoryFeatureQuery implements FeatureQueryPort {
  constructor(private readonly data: readonly RegisteredFeature[] = FEATURES) {}
  async list(): Promise<readonly RegisteredFeature[]> {
    return this.data;
  }
  async getById(id: string): Promise<RegisteredFeature | null> {
    return this.data.find((feature) => feature.id === id) ?? null;
  }
}

export class InMemoryFamilyQuery implements FamilyQueryPort {
  constructor(private readonly data: readonly FeatureFamily[] = FAMILIES) {}
  async list(): Promise<readonly FeatureFamily[]> {
    return this.data;
  }
}
