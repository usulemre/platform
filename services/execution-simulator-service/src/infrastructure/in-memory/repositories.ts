/**
 * In-memory read-model adapters. Development/test only — no persistence, no cache, no
 * database. They implement the query ports over the synthetic seed.
 */
import type {
  SimulationSession,
  SimulationComparison,
  SimulationFamily,
  ScenarioTemplate,
} from '@platform/execution-sdk';
import type {
  ComparisonQueryPort,
  FamilyQueryPort,
  SessionQueryPort,
  TemplateQueryPort,
} from '../ports';
import { COMPARISONS, FAMILIES, SESSIONS, TEMPLATES } from './seed';

export class InMemorySessionQuery implements SessionQueryPort {
  constructor(private readonly data: readonly SimulationSession[] = SESSIONS) {}
  async list(): Promise<readonly SimulationSession[]> {
    return this.data;
  }
  async getById(id: string): Promise<SimulationSession | null> {
    return this.data.find((session) => session.id === id) ?? null;
  }
}

export class InMemoryFamilyQuery implements FamilyQueryPort {
  constructor(private readonly data: readonly SimulationFamily[] = FAMILIES) {}
  async list(): Promise<readonly SimulationFamily[]> {
    return this.data;
  }
}

export class InMemoryComparisonQuery implements ComparisonQueryPort {
  constructor(private readonly data: readonly SimulationComparison[] = COMPARISONS) {}
  async list(): Promise<readonly SimulationComparison[]> {
    return this.data;
  }
  async getById(id: string): Promise<SimulationComparison | null> {
    return this.data.find((comparison) => comparison.id === id) ?? null;
  }
}

export class InMemoryTemplateQuery implements TemplateQueryPort {
  constructor(private readonly data: readonly ScenarioTemplate[] = TEMPLATES) {}
  async list(): Promise<readonly ScenarioTemplate[]> {
    return this.data;
  }
}
